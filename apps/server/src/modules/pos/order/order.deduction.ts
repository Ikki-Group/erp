import { record } from '@/infra/otel/otel.ts'
import { type Decimal, roundQty, safeDivide, toDecimal } from '@/shared/utils/money.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { RecipeService } from '@/modules/recipe/recipe.service.ts'
import type { UomConversionDto } from '@/modules/uom/uom.contract.ts'
import { resolveConversion } from '@/modules/uom/uom.resolver.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type { OrderLineDto } from './order.contract.ts'

// ─── Dependencies ───

export interface DeductionDeps {
	recipeService: RecipeService
	stockService: StockService
	uomService: UomService
	materialService: MaterialService
}

// ─── Deduction Engine ───

/**
 * Deducts inventory stock for each order line based on active recipes.
 *
 * For each line: resolves recipe → for each recipe line calculates deduction qty
 * (recipeLine.qty × orderLine.qty / recipe.yieldQty) → converts to material base UoM
 * → records stock movement (type=sale, direction=out).
 *
 * Errors are caught per-line and logged as warnings — never blocks order completion.
 */
export async function deductStockForOrder(
	orderId: number,
	locationId: number,
	orderLines: OrderLineDto[],
	actorId: number,
	deps: DeductionDeps,
): Promise<void> {
	return record('order.deductStock', async () => {
		const { recipeService, stockService, uomService, materialService } = deps

		// Pre-fetch all UoM conversions (single query, reused across lines)
		const conversions = await uomService.getAllConversions()

		for (const line of orderLines) {
			try {
				await deductForOrderLine(orderId, locationId, line, actorId, {
					recipeService,
					stockService,
					materialService,
					conversions,
				})
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err)
				console.warn(
					`[pos:deduction] Deduction failed for menuItemId=${line.menuItemId} in order #${orderId}: ${errorMessage}`,
				)
			}
		}
	})
}

// ─── Per-Line Deduction ───

interface LineDeductionCtx {
	recipeService: RecipeService
	stockService: StockService
	materialService: MaterialService
	conversions: UomConversionDto[]
}

async function deductForOrderLine(
	orderId: number,
	locationId: number,
	line: OrderLineDto,
	actorId: number,
	ctx: LineDeductionCtx,
): Promise<void> {
	const { recipeService, stockService, materialService, conversions } = ctx

	// 1. Get active recipe for menu item
	const recipe = await recipeService.getActiveByMenuItemId(line.menuItemId)
	if (!recipe) {
		console.warn(
			`[pos:deduction] No active recipe for menuItemId=${line.menuItemId}, skipping deduction for order #${orderId}`,
		)
		return
	}

	// 2. Get recipe lines and calculate deduction for each
	const recipeLines = await recipeService.getLinesByRecipeId(recipe.id)
	const orderQty = toDecimal(line.quantity)
	const yieldQty = toDecimal(recipe.yieldQty)

	for (const recipeLine of recipeLines) {
		await deductRecipeLine(orderId, locationId, recipeLine, orderQty, yieldQty, actorId, {
			stockService,
			materialService,
			conversions,
		})
	}
}

// ─── Per-Recipe-Line Deduction ───

interface RecipeLineCtx {
	stockService: StockService
	materialService: MaterialService
	conversions: UomConversionDto[]
}

interface RecipeLineInput {
	materialId: number
	quantity: string
	uomId: number
}

async function deductRecipeLine(
	orderId: number,
	locationId: number,
	recipeLine: RecipeLineInput,
	orderQty: Decimal,
	yieldQty: Decimal,
	actorId: number,
	ctx: RecipeLineCtx,
): Promise<void> {
	const { stockService, materialService, conversions } = ctx

	try {
		// 1. Calculate deduction: recipeLine.qty × orderLine.qty / yieldQty
		const recipeQty = toDecimal(recipeLine.quantity)
		const deductQty = safeDivide(recipeQty.mul(orderQty), yieldQty)

		// 2. Resolve UoM conversion to material base UoM
		const material = await materialService.getById(recipeLine.materialId)
		if (!material) {
			console.warn(
				`[pos:deduction] Material #${recipeLine.materialId} not found, skipping for order #${orderId}`,
			)
			return
		}

		const baseDeductQty = convertToBaseUom(
			deductQty,
			recipeLine.uomId,
			material.baseUomId,
			conversions,
			{
				materialId: recipeLine.materialId,
				orderId,
			},
		)

		// 3. Record stock movement
		await stockService.recordMovement({
			materialId: recipeLine.materialId,
			locationId,
			type: 'sale',
			direction: 'out',
			qty: roundQty(baseDeductQty),
			referenceType: 'order',
			referenceId: orderId,
			actorId,
		})
	} catch (err) {
		// Insufficient stock or material not assigned — log and continue
		const errorMessage = err instanceof Error ? err.message : String(err)
		console.warn(
			`[pos:deduction] Failed to deduct material #${recipeLine.materialId} for order #${orderId}: ${errorMessage}`,
		)
	}
}

// ─── Helpers ───

function convertToBaseUom(
	qty: Decimal,
	fromUomId: number,
	toUomId: number,
	conversions: UomConversionDto[],
	context: { materialId: number; orderId: number },
): Decimal {
	if (fromUomId === toUomId) return qty

	const conversion = resolveConversion(fromUomId, toUomId, qty.toString(), conversions)
	if (conversion) return toDecimal(conversion.result)

	console.warn(
		`[pos:deduction] No UoM conversion path from ${fromUomId} to ${toUomId} for material #${context.materialId}, using raw qty for order #${context.orderId}`,
	)
	return qty
}

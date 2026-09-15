import type { DbContext } from '@/infra/database/index.ts'
import { getLogger } from '@/infra/logger/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { StockMovementRecorded } from '@/shared/events/stock.events.ts'

import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { RecipeService } from '@/modules/recipe/recipe.service.ts'
import { resolveConversion } from '@/modules/uom/domain/uom.resolver.ts'
import type { UomConversionDto } from '@/modules/uom/uom.contract.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import type { OrderLineDto } from './order.contract.ts'

const logger = getLogger(['pos', 'deduction'])

// ─── Dependencies ───

export interface DeductionDeps {
	recipeService: RecipeService
	inventoryApi: InventoryApi['stock']
	uomService: UomService
	materialService: MaterialService
}

// ─── Deduction Engine ───

/**
 * Deducts inventory stock for each order line based on active recipes.
 *
 * Missing recipes and missing materials are non-blocking domain conditions.
 * Database and conversion failures propagate so the caller's UoW can roll back.
 */
export async function deductStockForOrder(
	orderId: number,
	locationId: number,
	orderLines: OrderLineDto[],
	actorId: number,
	deps: DeductionDeps,
	db?: DbContext,
): Promise<StockMovementRecorded[]> {
	return record('order.deductStock', async () => {
		const { recipeService, inventoryApi, uomService, materialService } = deps
		const conversions = await uomService.getAllConversions()
		const events: StockMovementRecorded[] = []

		for (const line of orderLines) {
			await deductForOrderLine(orderId, locationId, line, actorId, {
				recipeService,
				inventoryApi,
				materialService,
				conversions,
				db,
				events,
			})
		}
		return events
	})
}

// ─── Per-Line Deduction ───

interface LineDeductionCtx {
	recipeService: RecipeService
	inventoryApi: InventoryApi['stock']
	materialService: MaterialService
	conversions: UomConversionDto[]
	db: DbContext | undefined
	events: StockMovementRecorded[]
}

async function deductForOrderLine(
	orderId: number,
	locationId: number,
	line: OrderLineDto,
	actorId: number,
	ctx: LineDeductionCtx,
): Promise<void> {
	const { recipeService, inventoryApi, materialService, conversions, db } = ctx

	const recipe = await recipeService.getActiveByMenuItemId(line.menuItemId, db)
	if (!recipe) {
		logger.warn('No active recipe for menu item, skipping deduction', {
			menuItemId: line.menuItemId,
			orderId,
		})
		return
	}

	const recipeLines = await recipeService.getLinesByRecipeId(recipe.id, db)
	const orderQty = Qty.of(line.quantity)
	const yieldQty = Qty.of(recipe.yieldQty)

	for (const recipeLine of recipeLines) {
		await deductRecipeLine(orderId, locationId, recipeLine, orderQty, yieldQty, actorId, {
			inventoryApi,
			materialService,
			conversions,
			db,
			events: ctx.events,
		})
	}
}

// ─── Per-Recipe-Line Deduction ───

interface RecipeLineCtx {
	inventoryApi: InventoryApi['stock']
	materialService: MaterialService
	conversions: UomConversionDto[]
	db: DbContext | undefined
	events: StockMovementRecorded[]
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
	orderQty: Qty,
	yieldQty: Qty,
	actorId: number,
	ctx: RecipeLineCtx,
): Promise<void> {
	const { inventoryApi, materialService, conversions, db } = ctx
	const recipeQty = Qty.of(recipeLine.quantity)
	const deductQty = recipeQty.mul(orderQty).div(yieldQty)

	const material = await materialService.getById(recipeLine.materialId)
	if (!material) {
		logger.warn('Material not found, skipping deduction', {
			materialId: recipeLine.materialId,
			orderId,
		})
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

	const movement = await inventoryApi.recordMovement(
		{
			materialId: recipeLine.materialId,
			locationId,
			type: 'sales',
			direction: 'out',
			qty: baseDeductQty.toNumeric(),
			referenceType: 'order',
			referenceId: orderId,
			actorId,
		},
		db,
	)
	ctx.events.push(movement.event)
}

// ─── Helpers ───

function convertToBaseUom(
	qty: Qty,
	fromUomId: number,
	toUomId: number,
	conversions: UomConversionDto[],
	context: { materialId: number; orderId: number },
): Qty {
	if (fromUomId === toUomId) return qty

	const conversion = resolveConversion(fromUomId, toUomId, qty, conversions)
	if (conversion) return conversion.result

	logger.warn('No UoM conversion path, using raw qty', {
		fromUomId,
		toUomId,
		materialId: context.materialId,
		orderId: context.orderId,
	})
	return qty
}

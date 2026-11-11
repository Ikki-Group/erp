import type { DbContext } from '@/infra/database/index.ts'
import { getLogger } from '@/infra/logger/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { Qty } from '@/shared/domain/qty.ts'

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
 *
 * All deductions are planned first and then recorded in ascending materialId
 * order (the location is fixed), matching the canonical balance lock order so
 * concurrent orders touching the same materials cannot deadlock.
 */
export async function deductStockForOrder(
	orderId: number,
	locationId: number,
	orderLines: OrderLineDto[],
	actorId: number,
	deps: DeductionDeps,
	db?: DbContext,
): Promise<void> {
	return record('order.deductStock', async () => {
		const { recipeService, inventoryApi, uomService, materialService } = deps
		const conversions = await uomService.getAllConversions()
		const planned: PlannedDeduction[] = []

		for (const line of orderLines) {
			await planOrderLine(
				orderId,
				line,
				{ recipeService, materialService, conversions, db },
				planned,
			)
		}

		// Array.prototype.sort is stable: same-material deductions keep line order.
		planned.sort((a, b) => a.materialId - b.materialId)

		for (const deduction of planned) {
			await inventoryApi.recordMovement(
				{
					materialId: deduction.materialId,
					locationId,
					type: 'sales',
					direction: 'out',
					qty: deduction.qty.toNumeric(),
					referenceType: 'order',
					referenceId: orderId,
					actorId,
				},
				db,
			)
		}
	})
}

// ─── Planning ───

interface PlannedDeduction {
	materialId: number
	/** Quantity in the material's base UoM. */
	qty: Qty
}

interface PlanCtx {
	recipeService: RecipeService
	materialService: MaterialService
	conversions: UomConversionDto[]
	db: DbContext | undefined
}

async function planOrderLine(
	orderId: number,
	line: OrderLineDto,
	ctx: PlanCtx,
	planned: PlannedDeduction[],
): Promise<void> {
	const { recipeService, materialService, conversions, db } = ctx

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
		const material = await materialService.getById(recipeLine.materialId)
		if (!material) {
			logger.warn('Material not found, skipping deduction', {
				materialId: recipeLine.materialId,
				orderId,
			})
			continue
		}

		const deductQty = Qty.of(recipeLine.quantity).mul(orderQty).div(yieldQty)
		planned.push({
			materialId: recipeLine.materialId,
			qty: convertToBaseUom(deductQty, recipeLine.uomId, material.baseUomId, conversions, {
				materialId: recipeLine.materialId,
				orderId,
			}),
		})
	}
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

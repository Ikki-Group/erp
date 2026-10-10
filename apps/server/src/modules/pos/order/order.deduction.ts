import type { Db } from '@/infra/database/index.ts'
import { getLogger } from '@/infra/logger/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { Qty } from '@/shared/domain/qty.ts'

import type { StockService } from '@/modules/inventory/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import { recipeUsage } from '@/modules/recipe/index.ts'
import type { RecipeService } from '@/modules/recipe/index.ts'
import { resolveConversion } from '@/modules/uom/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import type { OrderLineDto } from '@ikki/contract/pos/order'

const logger = getLogger(['pos', 'deduction'])

export interface DeductionDeps {
	recipe: Pick<RecipeService, 'getActiveByMenuItemId' | 'getLinesByRecipeId'>
	stock: Pick<StockService, 'recordMovement'>
	uom: Pick<UomService, 'getAllConversions'>
	material: Pick<MaterialService, 'getByIds'>
}

/**
 * Deducts stock for a completed order's active lines from each item's active
 * base recipe (ADR-0011/0012). Runs inside the completion transaction. Missing
 * recipes/materials are skipped (permissive stock, ADR-0006); DB errors propagate
 * so the whole completion rolls back.
 */
export function deductStockForOrder(
	order: { id: number; locationId: number },
	lines: OrderLineDto[],
	actorId: number,
	deps: DeductionDeps,
	tx: Db,
): Promise<void> {
	return record('order.deductStock', async () => {
		const { recipe, stock, uom, material } = deps
		const conversions = await uom.getAllConversions(tx)

		for (const line of lines) {
			if (line.status !== 'active') continue
			const active = await recipe.getActiveByMenuItemId(line.menuItemId, tx)
			if (!active) {
				logger.warn('No active recipe for menu item, skipping deduction', {
					menuItemId: line.menuItemId,
					orderId: order.id,
				})
				continue
			}
			const recipeLines = await recipe.getLinesByRecipeId(active.id, tx)
			const materials = await material.getByIds(
				recipeLines.map((l) => l.materialId),
				tx,
			)
			const baseUomOf = new Map(materials.map((m) => [m.id, m.baseUomId]))

			for (const recipeLine of recipeLines) {
				const baseUomId = baseUomOf.get(recipeLine.materialId)
				if (baseUomId === undefined) {
					logger.warn('Material not found, skipping deduction', {
						materialId: recipeLine.materialId,
						orderId: order.id,
					})
					continue
				}
				const qty = recipeUsage(
					Qty.of(recipeLine.quantity),
					Qty.of(line.quantity),
					Qty.of(active.yieldQty),
				)
				const converted = resolveConversion(recipeLine.uomId, baseUomId, qty, conversions)
				if (!converted) {
					logger.warn('No UoM conversion path, using raw qty', {
						fromUomId: recipeLine.uomId,
						toUomId: baseUomId,
						materialId: recipeLine.materialId,
						orderId: order.id,
					})
				}
				await stock.recordMovement(
					{
						materialId: recipeLine.materialId,
						locationId: order.locationId,
						type: 'sales',
						direction: 'out',
						qty: (converted?.result ?? qty).toNumeric(),
						referenceType: 'order',
						referenceId: order.id,
						actorId,
					},
					tx,
				)
			}
		}
	})
}

import type { Db } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { StockService } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import { resolveConversion } from '@/modules/uom/index.ts'
import type { UomConversionDto, UomService } from '@/modules/uom/index.ts'

import { inputRequirement, outputUnitCost, plannedOutputQty } from './production.calculator.ts'
import type {
	ProductionOrderConfirmDto,
	ProductionOrderCreateDto,
	ProductionOrderDetailDto,
	ProductionOrderDto,
	ProductionOrderFilterDto,
	ProductionRecipeCreateDto,
	ProductionRecipeDetailDto,
	ProductionRecipeDto,
	ProductionRecipeFilterDto,
	ProductionRecipeUpdateDto,
} from '@ikki/contract/production'
import { ProductionError } from './production.internal.ts'
import type { ProductionRepo } from './production.repo.ts'

interface Deps extends Infra {
	repo: ProductionRepo
	stock: Pick<StockService, 'recordMovement' | 'getBalance'>
	location: Pick<LocationService, 'handleGetById'>
	material: Pick<MaterialService, 'handleGetById'>
	uom: Pick<UomService, 'getAllConversions'>
}

interface LineInput {
	materialId: number
	uomId: number
}

const AUDIT_RECIPE = { module: 'production', entity: 'recipe' } as const
const AUDIT_ORDER = { module: 'production', entity: 'order' } as const

export class ProductionService {
	constructor(private readonly deps: Deps) {}

	// ─── Recipes ───

	handleRecipeList(
		filter: ProductionRecipeFilterDto,
	): Promise<WithPaginationResult<ProductionRecipeDto>> {
		return this.deps.repo.findRecipePage(filter)
	}

	async handleRecipeDetail(id: number): Promise<ProductionRecipeDetailDto> {
		return assertFound(await this.deps.repo.findRecipeDetailById(id), () =>
			ProductionError.recipeNotFound(id),
		)
	}

	handleRecipeCreate(data: ProductionRecipeCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, material, uom } = this.deps
		return uow.run(async (tx) => {
			const output = await material.handleGetById(data.outputMaterialId, tx)
			if (output.type !== 'semi_finished') {
				throw ProductionError.notSemiFinished(data.outputMaterialId)
			}
			const conversions = await uom.getAllConversions(tx)
			convert(data.yieldUomId, output.baseUomId, Qty.of('1'), conversions, output.id)
			await this.#validateLines(data.lines, conversions, tx)

			const created = await repo.insertRecipe(
				{
					materialId: data.outputMaterialId,
					name: data.name,
					yieldQty: data.yieldQty,
					yieldUomId: data.yieldUomId,
					isActive: true,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw ProductionError.createFailed()
			await repo.replaceRecipeLines(created.id, toRecipeLines(created.id, data.lines), tx)
			await audit.record(tx, actor, {
				...AUDIT_RECIPE,
				entityId: created.id,
				action: 'create',
				summary: `Created production recipe "${data.name}" for material #${data.outputMaterialId}`,
				newValues: {
					name: data.name,
					outputMaterialId: data.outputMaterialId,
					yieldQty: data.yieldQty,
					lineCount: data.lines.length,
				},
			})
			return created
		})
	}

	handleRecipeUpdate(data: ProductionRecipeUpdateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, material, uom } = this.deps
		return uow.run(async (tx) => {
			const recipe = assertFound(await repo.findRecipeById(data.recipeId, tx), () =>
				ProductionError.recipeNotFound(data.recipeId),
			)
			const conversions = await uom.getAllConversions(tx)
			if (data.yieldUomId) {
				const output = await material.handleGetById(recipe.materialId, tx)
				convert(data.yieldUomId, output.baseUomId, Qty.of('1'), conversions, output.id)
			}
			if (data.lines) await this.#validateLines(data.lines, conversions, tx)

			const updated = await repo.updateRecipe(
				data.recipeId,
				{
					...(data.name ? { name: data.name } : {}),
					...(data.yieldQty ? { yieldQty: data.yieldQty } : {}),
					...(data.yieldUomId ? { yieldUomId: data.yieldUomId } : {}),
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!updated) throw ProductionError.recipeNotFound(data.recipeId)
			if (data.lines) {
				await repo.replaceRecipeLines(data.recipeId, toRecipeLines(data.recipeId, data.lines), tx)
			}
			await audit.record(tx, actor, {
				...AUDIT_RECIPE,
				entityId: data.recipeId,
				action: 'update',
				summary: `Updated production recipe #${data.recipeId}`,
				newValues: { name: data.name, yieldQty: data.yieldQty, lineCount: data.lines?.length },
			})
			return updated
		})
	}

	handleRecipeRemove(id: number, actor: Actor): Promise<void> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const recipe = assertFound(await repo.findRecipeById(id, tx), () =>
				ProductionError.recipeNotFound(id),
			)
			// Lines cascade.
			if (!(await repo.removeRecipe(id, tx))) throw ProductionError.recipeNotFound(id)
			await audit.record(tx, actor, {
				...AUDIT_RECIPE,
				entityId: id,
				action: 'delete',
				summary: `Removed production recipe #${id}`,
				oldValues: { name: recipe.name, materialId: recipe.materialId },
			})
		})
	}

	// ─── Orders ───

	handleOrderList(
		filter: ProductionOrderFilterDto,
	): Promise<WithPaginationResult<ProductionOrderDto>> {
		return this.deps.repo.findOrderPage(filter)
	}

	async handleOrderDetail(id: number): Promise<ProductionOrderDetailDto> {
		return assertFound(await this.deps.repo.findOrderDetailById(id), () =>
			ProductionError.orderNotFound(id),
		)
	}

	async handleOrderCreate(data: ProductionOrderCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, location } = this.deps
		const loc = await location.handleGetById(data.locationId)
		return uow.run(async (tx) => {
			const recipe = assertFound(await repo.findRecipeById(data.recipeId, tx), () =>
				ProductionError.recipeNotFound(data.recipeId),
			)
			const plannedQty = plannedOutputQty(
				Qty.of(recipe.yieldQty),
				Qty.of(data.multiplier),
			).toNumeric()
			const productionNo = await generateNumber({
				prefix: 'PRD',
				locationCode: loc.code,
				locationId: data.locationId,
				database: tx,
			})
			const created = await repo.insertOrder(
				{
					productionNo,
					locationId: data.locationId,
					materialId: recipe.materialId,
					recipeId: data.recipeId,
					status: 'draft',
					plannedQty,
					actualQty: null,
					notes: data.notes ?? null,
					producedBy: actor.id,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!created) throw ProductionError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT_ORDER,
				entityId: created.id,
				action: 'create',
				summary: `Created production order ${productionNo} for recipe #${data.recipeId} at location #${data.locationId}`,
				newValues: {
					productionNo,
					recipeId: data.recipeId,
					locationId: data.locationId,
					multiplier: data.multiplier,
					plannedQty,
				},
				locationId: data.locationId,
			})
			return created
		})
	}

	/**
	 * Complete a production order in one transaction (ADR-0014 §1): consume
	 * inputs (permissive), produce the output at the absorbed input cost.
	 */
	handleOrderConfirm(data: ProductionOrderConfirmDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, stock, material, uom } = this.deps
		return record('production.confirm', () =>
			uow.run(async (tx) => {
				const order = assertFound(await repo.findOrderById(data.orderId, tx), () =>
					ProductionError.orderNotFound(data.orderId),
				)
				if (order.status === 'completed') throw ProductionError.alreadyConfirmed(data.orderId)
				if (order.status !== 'draft') throw ProductionError.notDraft(data.orderId)
				const recipe = assertFound(await repo.findRecipeDetailById(order.recipeId, tx), () =>
					ProductionError.recipeNotFound(order.recipeId),
				)

				const conversions = await uom.getAllConversions(tx)
				const plannedQty = Qty.of(order.plannedQty)
				const movement = {
					locationId: order.locationId,
					referenceType: 'production_order',
					referenceId: order.id,
					notes: `Production: ${order.productionNo}`,
					actorId: actor.id,
				}

				const consumed: { qty: Qty; unitCost: Money }[] = []
				for (const line of recipe.lines) {
					const input = await material.handleGetById(line.materialId, tx)
					const required = inputRequirement(
						Qty.of(line.quantity),
						Qty.of(recipe.yieldQty),
						plannedQty,
					)
					const baseQty = convert(line.uomId, input.baseUomId, required, conversions, input.id)
					// Outbound never changes cost, so the pre-deduction cost is the consumed cost.
					const balance = await stock.getBalance(line.materialId, order.locationId, tx)
					consumed.push({ qty: baseQty, unitCost: Money.of(balance?.costPrice ?? '0') })
					await stock.recordMovement(
						{
							...movement,
							materialId: line.materialId,
							type: 'production_out',
							direction: 'out',
							qty: baseQty.toNumeric(),
						},
						tx,
					)
				}

				const output = await material.handleGetById(recipe.materialId, tx)
				const outputQty = convert(
					recipe.yieldUomId,
					output.baseUomId,
					plannedQty,
					conversions,
					output.id,
				)
				await stock.recordMovement(
					{
						...movement,
						materialId: recipe.materialId,
						type: 'production_in',
						direction: 'in',
						qty: outputQty.toNumeric(),
						unitCost: outputUnitCost(consumed, outputQty).toCost(),
					},
					tx,
				)

				const updated = await repo.updateOrder(
					order.id,
					{
						status: 'completed',
						actualQty: outputQty.toNumeric(),
						completedAt: new Date(),
						...stampUpdate(actor.id),
					},
					tx,
				)
				if (!updated) throw ProductionError.orderNotFound(order.id)
				await audit.record(tx, actor, {
					...AUDIT_ORDER,
					entityId: order.id,
					action: 'confirm',
					summary: `Confirmed production order ${order.productionNo} (${recipe.lines.length} inputs)`,
					newValues: { status: 'completed', lineCount: recipe.lines.length },
					locationId: order.locationId,
				})
				return updated
			}),
		)
	}

	/** Each input UoM must convert to its material's base UoM. */
	async #validateLines(lines: LineInput[], conversions: UomConversionDto[], db: Db): Promise<void> {
		for (const line of lines) {
			const input = await this.deps.material.handleGetById(line.materialId, db)
			convert(line.uomId, input.baseUomId, Qty.of('1'), conversions, input.id)
		}
	}
}

function convert(
	fromUomId: number,
	toUomId: number,
	qty: Qty,
	conversions: UomConversionDto[],
	materialId: number,
): Qty {
	const resolved = resolveConversion(fromUomId, toUomId, qty, conversions)
	if (!resolved) throw ProductionError.uomNotConvertible(materialId, fromUomId, toUomId)
	return resolved.result
}

function toRecipeLines(recipeId: number, lines: (LineInput & { qty: string })[]) {
	return lines.map((line) => ({
		recipeId,
		materialId: line.materialId,
		quantity: line.qty,
		uomId: line.uomId,
	}))
}

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { record } from '@/infra/otel/otel.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { StockMovementRecorded } from '@/shared/events/stock.events.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

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
} from './production.contract.ts'
import { ProductionError } from './production.internal.ts'
import type { IProductionRepo } from './production.repo.ts'

// ─── Dependencies ───

export interface ProductionServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	inventoryApi: InventoryApi['stock']
	locationService: LocationService
	materialService: MaterialService
	uomService: UomService
}

// ─── Service ───

export class ProductionService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IProductionRepo,
		cacheClient: CacheClient,
		private readonly deps: ProductionServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'production')
	}

	// ─── Recipe Handlers ───

	async handleRecipeList(
		filter: ProductionRecipeFilterDto,
	): Promise<WithPaginationResult<ProductionRecipeDto>> {
		return this.repo.findRecipePage(filter)
	}

	async handleRecipeDetail(id: number): Promise<ProductionRecipeDetailDto> {
		return assertFound(await this.repo.findRecipeDetailById(id), () =>
			ProductionError.recipeNotFound(id),
		)
	}

	async handleRecipeCreate(data: ProductionRecipeCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate output material is semi_finished
		const outputMaterial = await this.deps.materialService.handleGetById(data.outputMaterialId)
		if (outputMaterial.type !== 'semi_finished') {
			throw ProductionError.notSemiFinished(data.outputMaterialId)
		}

		// 2. Validate yield UoM is convertible to output material's baseUom
		await this.#validateUomConversion(
			data.yieldUomId,
			outputMaterial.baseUomId,
			data.outputMaterialId,
		)

		// 3. Validate each input line
		for (const line of data.lines) {
			const material = await this.deps.materialService.handleGetById(line.materialId)
			await this.#validateUomConversion(line.uomId, material.baseUomId, line.materialId)
		}

		// 4. Insert recipe + lines in transaction
		const result = await this.deps.uow.run(async (tx) => {
			const created = await this.repo.insertRecipe(
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

			await this.repo.replaceRecipeLines(
				created.id,
				data.lines.map((line) => ({
					recipeId: created.id,
					materialId: line.materialId,
					quantity: line.qty,
					uomId: line.uomId,
				})),
				tx,
			)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'production',
					entity: 'recipe',
					entityId: created.id,
					action: 'create',
					summary: `Created production recipe "${data.name}" for material #${data.outputMaterialId}`,
					newValues: {
						name: data.name,
						outputMaterialId: data.outputMaterialId,
						yieldQty: data.yieldQty,
						lineCount: data.lines.length,
					},
				}),
				tx,
			)

			return created
		})

		// 5. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result
	}

	async handleRecipeUpdate(data: ProductionRecipeUpdateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate recipe exists
		const recipe = assertFound(await this.repo.findRecipeById(data.recipeId), () =>
			ProductionError.recipeNotFound(data.recipeId),
		)

		// 2. Validate yield UoM if changed
		if (data.yieldUomId) {
			const outputMaterial = await this.deps.materialService.handleGetById(recipe.materialId)
			await this.#validateUomConversion(
				data.yieldUomId,
				outputMaterial.baseUomId,
				recipe.materialId,
			)
		}

		// 3. Validate input lines if provided
		if (data.lines) {
			for (const line of data.lines) {
				const material = await this.deps.materialService.handleGetById(line.materialId)
				await this.#validateUomConversion(line.uomId, material.baseUomId, line.materialId)
			}
		}

		// 4. Update recipe + lines in transaction
		const result = await this.deps.uow.run(async (tx) => {
			const updated = await this.repo.updateRecipe(
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
				await this.repo.replaceRecipeLines(
					data.recipeId,
					data.lines.map((line) => ({
						recipeId: data.recipeId,
						materialId: line.materialId,
						quantity: line.qty,
						uomId: line.uomId,
					})),
					tx,
				)
			}

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'production',
					entity: 'recipe',
					entityId: data.recipeId,
					action: 'update',
					summary: `Updated production recipe #${data.recipeId}`,
					newValues: { name: data.name, yieldQty: data.yieldQty, lineCount: data.lines?.length },
				}),
				tx,
			)

			return updated
		})

		// 5. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result
	}

	async handleRecipeRemove(id: number, actor: Actor): Promise<void> {
		await this.deps.uow.run(async (tx) => {
			// 1. Validate exists
			const recipe = assertFound(await this.repo.findRecipeById(id, tx), () =>
				ProductionError.recipeNotFound(id),
			)

			// 2. Remove (cascade deletes lines)
			const removed = await this.repo.removeRecipe(id, tx)
			if (!removed) throw ProductionError.recipeNotFound(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'production',
					entity: 'recipe',
					entityId: id,
					action: 'delete',
					summary: `Removed production recipe #${id}`,
					oldValues: { name: recipe.name, materialId: recipe.materialId },
				}),
				tx,
			)
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard()
	}

	// ─── Order Handlers ───

	async handleOrderList(
		filter: ProductionOrderFilterDto,
	): Promise<WithPaginationResult<ProductionOrderDto>> {
		return this.repo.findOrderPage(filter)
	}

	async handleOrderDetail(id: number): Promise<ProductionOrderDetailDto> {
		return assertFound(await this.repo.findOrderDetailById(id), () =>
			ProductionError.orderNotFound(id),
		)
	}

	async handleOrderCreate(data: ProductionOrderCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate recipe exists
		const recipe = assertFound(await this.repo.findRecipeDetailById(data.recipeId), () =>
			ProductionError.recipeNotFound(data.recipeId),
		)

		// 2. Validate location exists and get code
		const location = await this.deps.locationService.handleGetById(data.locationId)

		// 3. Calculate planned output quantity
		const plannedQty = Qty.of(recipe.yieldQty).mul(data.multiplier).toNumeric()

		// 4. Generate number and insert the order atomically
		const result = await this.deps.uow.run(async (tx) => {
			const productionNo = await generateNumber({
				prefix: 'PRD',
				locationCode: location.code,
				locationId: data.locationId,
				database: tx,
			})
			const result = await this.repo.insertOrder(
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
			if (!result) throw ProductionError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'production',
					entity: 'order',
					entityId: result.id,
					action: 'create',
					summary: `Created production order ${productionNo} for recipe #${data.recipeId} at location #${data.locationId}`,
					newValues: {
						productionNo,
						recipeId: data.recipeId,
						locationId: data.locationId,
						multiplier: data.multiplier,
						plannedQty,
					},
				}),
				tx,
			)

			return { result, productionNo }
		})

		// 6. Invalidate cache after commit
		await this.cache.invalidateStandard()

		return result.result
	}

	async handleOrderConfirm(data: ProductionOrderConfirmDto, actor: Actor): Promise<EntityRef> {
		return record('production.confirm', async () => {
			// 1. Get order and validate status
			const order = assertFound(await this.repo.findOrderById(data.orderId), () =>
				ProductionError.orderNotFound(data.orderId),
			)

			if (order.status === 'completed') {
				throw ProductionError.alreadyConfirmed(data.orderId)
			}
			if (order.status !== 'draft') {
				throw ProductionError.notDraft(data.orderId)
			}

			// 2. Get recipe with lines
			const recipe = assertFound(await this.repo.findRecipeDetailById(order.recipeId), () =>
				ProductionError.recipeNotFound(order.recipeId),
			)

			// 3. Calculate multiplier from order
			const multiplier = Qty.of(order.plannedQty).div(Qty.of(recipe.yieldQty))

			// 4. Process within transaction
			const { updated, events } = await this.deps.uow.run(async (tx) => {
				const events: StockMovementRecorded[] = []
				let totalInputCost = Money.zero()

				// 4a. For each input line: convert to base UoM, get cost, record movement out
				for (const line of recipe.lines) {
					const material = await this.deps.materialService.handleGetById(line.materialId)
					const requiredQty = Qty.of(line.quantity).mul(multiplier)

					// Convert to base UoM
					const baseConversion = await this.#resolveConversion(
						line.uomId,
						material.baseUomId,
						requiredQty,
					)
					const baseQty = baseConversion.result

					// Get current cost price BEFORE deduction (cost unchanged on outbound)
					const balance = await this.deps.inventoryApi.getBalance(
						line.materialId,
						order.locationId,
						tx,
					)
					const costPrice = Money.of(balance?.costPrice ?? '0')
					totalInputCost = totalInputCost.add(costPrice.mul(baseQty))

					// Record outbound movement (stockService handles insufficient stock check)
					const movement = await this.deps.inventoryApi.recordMovement(
						{
							materialId: line.materialId,
							locationId: order.locationId,
							type: 'production_out',
							direction: 'out',
							qty: baseQty.toNumeric(),
							referenceType: 'production_order',
							referenceId: order.id,
							notes: `Production: ${order.productionNo}`,
							actorId: actor.id,
						},
						tx,
					)
					events.push(movement.event)
				}

				// 4b. Calculate output unit cost (absorbed costing)
				const outputMaterial = await this.deps.materialService.handleGetById(recipe.materialId)

				// Convert yield to base UoM if needed
				const yieldConversion = await this.#resolveConversion(
					recipe.yieldUomId,
					outputMaterial.baseUomId,
					Qty.of(order.plannedQty),
				)
				const baseOutputQty = yieldConversion.result
				const outputUnitCost = baseOutputQty.isZero()
					? '0'
					: totalInputCost.div(baseOutputQty).toCost()

				// 4c. Record inbound movement for output
				const movement = await this.deps.inventoryApi.recordMovement(
					{
						materialId: recipe.materialId,
						locationId: order.locationId,
						type: 'production_in',
						direction: 'in',
						qty: baseOutputQty.toNumeric(),
						unitCost: outputUnitCost,
						referenceType: 'production_order',
						referenceId: order.id,
						notes: `Production: ${order.productionNo}`,
						actorId: actor.id,
					},
					tx,
				)
				events.push(movement.event)

				// 4d. Update order status
				const updated = await this.repo.updateOrder(
					order.id,
					{
						status: 'completed',
						actualQty: baseOutputQty.toNumeric(),
						completedAt: new Date(),
						...stampUpdate(actor.id),
					},
					tx,
				)
				if (!updated) throw ProductionError.orderNotFound(order.id)

				await this.deps.audit.record(
					{
						actorId: actor.id,
						actorName: actor.name,
						locationId: order.locationId,
						module: 'production',
						entity: 'order',
						entityId: order.id,
						action: 'confirm',
						summary: `Confirmed production order ${order.productionNo} (${recipe.lines.length} inputs)`,
						newValues: { status: 'completed', lineCount: recipe.lines.length },
					},
					tx,
				)

				return { updated, events }
			})

			for (const event of events) this.deps.events.publish(event)
			await this.deps.inventoryApi.invalidateCache()
			await this.cache.invalidateStandard()

			return updated
		})
	}

	// ─── Private ───

	async #validateUomConversion(
		fromUomId: number,
		toUomId: number,
		materialId: number,
	): Promise<void> {
		if (fromUomId === toUomId) return

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/domain/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, Qty.of('1'), conversions)
		if (!resolved) {
			throw ProductionError.uomNotConvertible(materialId, fromUomId, toUomId)
		}
	}

	async #resolveConversion(
		fromUomId: number,
		toUomId: number,
		quantity: Qty,
	): Promise<{ result: Qty }> {
		if (fromUomId === toUomId) return { result: quantity }

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/domain/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, quantity, conversions)
		if (!resolved) {
			throw ProductionError.uomNotConvertible(0, fromUomId, toUomId)
		}
		return { result: resolved.result }
	}
}

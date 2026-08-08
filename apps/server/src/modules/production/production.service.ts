import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { withTransaction } from '@/infra/database/index.ts'
import { generateNumber } from '@/infra/numbering/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'
import { roundCost, roundQty, safeDivide, toDecimal } from '@/shared/utils/money.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
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
	stockService: StockService
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

	async handleRecipeCreate(data: ProductionRecipeCreateDto, actorId: ActorId): Promise<EntityRef> {
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
		const result = await withTransaction(this.repo.db, async (tx) => {
			const created = await this.repo.insertRecipe(
				{
					materialId: data.outputMaterialId,
					name: data.name,
					yieldQty: data.yieldQty,
					yieldUomId: data.yieldUomId,
					isActive: 1,
					...stampCreate(actorId),
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

			return created
		})

		// 5. Invalidate cache
		await this.cache.invalidateStandard()

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'production',
			entity: 'recipe',
			entityId: result.id,
			action: 'create',
			summary: `Created production recipe "${data.name}" for material #${data.outputMaterialId}`,
			newValues: {
				name: data.name,
				outputMaterialId: data.outputMaterialId,
				yieldQty: data.yieldQty,
				lineCount: data.lines.length,
			},
		})

		return result
	}

	async handleRecipeUpdate(data: ProductionRecipeUpdateDto, actorId: ActorId): Promise<EntityRef> {
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
		const result = await withTransaction(this.repo.db, async (tx) => {
			const updated = await this.repo.updateRecipe(
				data.recipeId,
				{
					...(data.name ? { name: data.name } : {}),
					...(data.yieldQty ? { yieldQty: data.yieldQty } : {}),
					...(data.yieldUomId ? { yieldUomId: data.yieldUomId } : {}),
					...stampUpdate(actorId),
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

			return updated
		})

		// 5. Invalidate cache
		await this.cache.invalidateStandard()

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'production',
			entity: 'recipe',
			entityId: data.recipeId,
			action: 'update',
			summary: `Updated production recipe #${data.recipeId}`,
			newValues: { name: data.name, yieldQty: data.yieldQty, lineCount: data.lines?.length },
		})

		return result
	}

	async handleRecipeRemove(id: number, actorId: ActorId): Promise<void> {
		// 1. Validate exists
		assertFound(await this.repo.findRecipeById(id), () => ProductionError.recipeNotFound(id))

		// 2. Remove (cascade deletes lines)
		await this.repo.removeRecipe(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'production',
			entity: 'recipe',
			entityId: id,
			action: 'delete',
			summary: `Removed production recipe #${id}`,
		})
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

	async handleOrderCreate(data: ProductionOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate recipe exists
		const recipe = assertFound(await this.repo.findRecipeDetailById(data.recipeId), () =>
			ProductionError.recipeNotFound(data.recipeId),
		)

		// 2. Validate location exists and get code
		const location = await this.deps.locationService.handleGetById(data.locationId)

		// 3. Calculate planned output quantity
		const plannedQty = roundQty(toDecimal(recipe.yieldQty).mul(toDecimal(data.multiplier)))

		// 4. Generate production number
		const productionNo = await generateNumber({
			prefix: 'PRD',
			locationCode: location.code,
			locationId: data.locationId,
		})

		// 5. Insert order
		const result = await this.repo.insertOrder({
			productionNo,
			locationId: data.locationId,
			materialId: recipe.materialId,
			recipeId: data.recipeId,
			status: 'draft',
			plannedQty,
			actualQty: null,
			notes: data.notes ?? null,
			producedBy: actorId,
			...stampCreate(actorId),
		})
		if (!result) throw ProductionError.createFailed()

		// 6. Invalidate cache
		await this.cache.invalidateStandard()

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
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
		})

		return result
	}

	async handleOrderConfirm(data: ProductionOrderConfirmDto, actorId: ActorId): Promise<EntityRef> {
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
		const multiplier = safeDivide(toDecimal(order.plannedQty), toDecimal(recipe.yieldQty))

		// 4. Process within transaction
		const result = await withTransaction(this.repo.db, async (tx) => {
			let totalInputCost = toDecimal(0)

			// 4a. For each input line: convert to base UoM, get cost, record movement out
			for (const line of recipe.lines) {
				const material = await this.deps.materialService.handleGetById(line.materialId)
				const requiredQty = roundQty(toDecimal(line.quantity).mul(multiplier))

				// Convert to base UoM
				const baseConversion = await this.#resolveConversion(
					line.uomId,
					material.baseUomId,
					requiredQty,
				)
				const baseQty = baseConversion.result

				// Get current cost price BEFORE deduction (cost unchanged on outbound)
				const balance = await this.deps.stockService.handleGetBalance({
					materialId: line.materialId,
					locationId: order.locationId,
				})
				const costPrice = toDecimal(balance.costPrice)
				totalInputCost = totalInputCost.add(toDecimal(baseQty).mul(costPrice))

				// Record outbound movement (stockService handles insufficient stock check)
				await this.deps.stockService.recordMovement(
					{
						materialId: line.materialId,
						locationId: order.locationId,
						type: 'production_out',
						direction: 'out',
						qty: baseQty,
						referenceType: 'production_order',
						referenceId: order.id,
						notes: `Production: ${order.productionNo}`,
						actorId,
					},
					tx,
				)
			}

			// 4b. Calculate output unit cost (absorbed costing)
			const outputMaterial = await this.deps.materialService.handleGetById(recipe.materialId)

			// Convert yield to base UoM if needed
			const yieldConversion = await this.#resolveConversion(
				recipe.yieldUomId,
				outputMaterial.baseUomId,
				order.plannedQty,
			)
			const baseOutputQty = yieldConversion.result
			const outputUnitCost = toDecimal(baseOutputQty).isZero()
				? '0'
				: roundCost(safeDivide(totalInputCost, toDecimal(baseOutputQty)))

			// 4c. Record inbound movement for output
			await this.deps.stockService.recordMovement(
				{
					materialId: recipe.materialId,
					locationId: order.locationId,
					type: 'production_in',
					direction: 'in',
					qty: baseOutputQty,
					unitCost: outputUnitCost,
					referenceType: 'production_order',
					referenceId: order.id,
					notes: `Production: ${order.productionNo}`,
					actorId,
				},
				tx,
			)

			// 4d. Update order status
			const updated = await this.repo.updateOrder(
				order.id,
				{
					status: 'completed',
					actualQty: baseOutputQty,
					completedAt: new Date(),
					...stampUpdate(actorId),
				},
				tx,
			)
			if (!updated) throw ProductionError.orderNotFound(order.id)

			return updated
		})

		// 5. Invalidate cache
		await this.cache.invalidateStandard()

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'production',
			entity: 'order',
			entityId: order.id,
			action: 'update',
			summary: `Confirmed production order ${order.productionNo} (${recipe.lines.length} inputs)`,
			newValues: { status: 'completed', lineCount: recipe.lines.length },
		})

		return result
	}

	// ─── Private ───

	async #validateUomConversion(
		fromUomId: number,
		toUomId: number,
		materialId: number,
	): Promise<void> {
		if (fromUomId === toUomId) return

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, '1', conversions)
		if (!resolved) {
			throw ProductionError.uomNotConvertible(materialId, fromUomId, toUomId)
		}
	}

	async #resolveConversion(
		fromUomId: number,
		toUomId: number,
		quantity: string,
	): Promise<{ result: string }> {
		if (fromUomId === toUomId) return { result: quantity }

		const conversions = await this.deps.uomService.getAllConversions()
		const { resolveConversion } = await import('@/modules/uom/uom.resolver.ts')
		const resolved = resolveConversion(fromUomId, toUomId, quantity, conversions)
		if (!resolved) {
			throw ProductionError.uomNotConvertible(0, fromUomId, toUomId)
		}
		return resolved
	}
}

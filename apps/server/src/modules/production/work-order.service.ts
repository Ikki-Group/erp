import Decimal from 'decimal.js'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { DbClient } from '@/infra/database'
import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { StockTransactionService } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

import { WorkOrderRepo } from './work-order.repo'
import type {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
} from './work-order.contract'

export class WorkOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: WorkOrderRepo,
		private readonly db: DbClient,
		private readonly recipeSvc: RecipeService,
		private readonly stockTransactionSvc: StockTransactionService,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'production.work-order')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<WorkOrderDto> {
		const key = `byId:${id}`
		const wo = await this.cache.getOrSetWithSkip({
			key,
			factory: () => this.repo.getById(id),
		})
		if (!wo) throw new NotFoundError(`Work Order with ID ${id} not found`, { code: 'WORK_ORDER_NOT_FOUND' })
		return wo
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<WorkOrderDto> {
		return this.getById(id)
	}

	async handleCreate(data: WorkOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleStart(id: number, actorId: ActorId): Promise<EntityRef> {
		const wo = await this.getById(id)
		if (wo.status !== 'draft') throw new ConflictError(`Only draft Work Orders can be started`)

		const result = await this.repo.update(
			id,
			{ status: 'in_progress', startedAt: new Date() },
			actorId,
		)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleComplete(
		id: number,
		data: WorkOrderCompleteDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		const wo = await this.getById(id)
		if (wo.status !== 'in_progress')
			throw new ConflictError(
				`Work Order with ID ${id} is not in progress`,
				{ code: 'WORK_ORDER_STATUS_CONFLICT' })

		const recipe = await this.recipeSvc.getById(wo.recipeId)
		const actualQty = new Decimal(data.actualQty)
		const targetQty = new Decimal(recipe.targetQty)
		const multiplier = actualQty.div(targetQty.isPositive() ? targetQty : 1)

		const costRes = await this.recipeSvc.handleCalculateCost(wo.recipeId)
		const actualTotalCost = new Decimal(costRes.totalCost).mul(multiplier)

		return this.db.transaction(async (tx) => {
			// 1. Consume raw materials
			if (recipe.items) {
				await this.stockTransactionSvc.handleProductionOut(
					{
						locationId: wo.locationId,
						date: new Date(),
						referenceNo: `WO-OUT-${wo.id}`,
						notes: `Consumed for Work Order #${wo.id}`,
						items: recipe.items.map((item) => ({
							materialId: item.materialId,
							qty: new Decimal(item.qty)
								.mul(multiplier)
								.mul(new Decimal(1).plus(new Decimal(item.scrapPercentage).div(100)))
								.toString(),
						})),
					},
					actorId,
					tx,
				)
			}

			// 2. Add finished good
			if (recipe.materialId) {
				await this.stockTransactionSvc.handleProductionIn(
					{
						locationId: wo.locationId,
						date: new Date(),
						referenceNo: `WO-IN-${wo.id}`,
						notes: `Produced from Work Order #${wo.id}`,
						items: [
							{
								materialId: recipe.materialId,
								qty: actualQty.toString(),
								unitCost: actualTotalCost.div(actualQty).toString(),
							},
						],
					},
					actorId,
					tx,
				)
			}

			// 3. Finalize Work Order
			const result = await this.repo.update(
				id,
				{
					status: 'completed',
					actualQty: actualQty.toString(),
					totalCost: actualTotalCost.toString(),
					completedAt: new Date(),
				},
				actorId,
			)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}
}

import { money } from '@/shared/utils/money'
import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbTx } from '@/infra/database'
import { withTransaction } from '@/infra/database'
import { stampCreate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
} from './work-order.contract'
import { ProductionError } from './production.internal'
import type { IWorkOrderRepo } from './work-order.repo'

export interface RecipeItemForWorkOrder {
	materialId: number
	qty: string
	scrapPercentage: string
}

export interface RecipeReadResult {
	id: number
	materialId: number | null
	targetQty: string
	items?: RecipeItemForWorkOrder[] | undefined
}

export interface RecipeReadPort {
	getById(id: number): Promise<RecipeReadResult | undefined>
	handleCalculateCost(recipeId: number): Promise<{ totalCost: string }>
}

export interface StockTransactionPort {
	productionIn(
		data: {
			locationId: number
			date: Date
			referenceNo: string
			notes: string | null
			items: Array<{ materialId: number; qty: string; unitCost: string }>
		},
		actorId: number,
		tx: DbTx,
	): Promise<{ count: number; referenceNo: string }>
	productionOut(
		data: {
			locationId: number
			date: Date
			referenceNo: string
			notes: string | null
			items: Array<{ materialId: number; qty: string }>
		},
		actorId: number,
		tx: DbTx,
	): Promise<{ count: number; referenceNo: string }>
}

export interface WorkOrderDeps {
	recipe: RecipeReadPort
	stockTransaction: StockTransactionPort
}

export class WorkOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: WorkOrderDeps,
		private readonly repo: IWorkOrderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'production.work-order')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	private async getById(id: number): Promise<WorkOrderDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async handleList(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		return record('WorkOrderService.handleList', async () =>
			this.cache.getOrSet({
				key: `${this.cache.keys.list}.${JSON.stringify(filter)}`,
				factory: () => this.repo.findPage(filter),
			}),
		)
	}

	async handleDetail(id: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw ProductionError.notFound(id)
			return result
		})
	}

	async handleCreate(data: WorkOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('WorkOrderService.handleCreate', async () => {
			const result = await this.repo.insert(
				{
					recipeId: data.recipeId,
					locationId: data.locationId,
					expectedQty: data.expectedQty,
					note: data.note,
					...stampCreate(actorId),
				},
				actorId,
			)
			if (!result) throw ProductionError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleStart(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('WorkOrderService.handleStart', async () => {
			const wo = await this.getById(id)
			if (!wo) throw ProductionError.notFound(id)
			if (wo.status !== 'draft') throw ProductionError.invalidStatus(id, wo.status)

			const result = await this.repo.update(
				id,
				{ status: 'in_progress', startedAt: new Date() },
				actorId,
			)
			if (!result) throw ProductionError.updateFailed()

			await this.invalidate(id)
			return result
		})
	}

	async handleComplete(
		id: number,
		data: WorkOrderCompleteDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('WorkOrderService.handleComplete', async () => {
			const wo = await this.getById(id)
			if (!wo) throw ProductionError.notFound(id)
			if (wo.status !== 'in_progress') throw ProductionError.notInProgress(id)

			const recipe = await this.deps.recipe.getById(wo.recipeId)
			if (!recipe) throw ProductionError.notFound(wo.recipeId)

			const actualQty = money(data.actualQty)
			const targetQty = money(recipe.targetQty)
			const multiplier = actualQty.div(targetQty.isPositive() ? targetQty : 1)

			const costRes = await this.deps.recipe.handleCalculateCost(wo.recipeId)
			const actualTotalCost = money(costRes.totalCost).mul(multiplier)

			const result = await withTransaction(this.repo.db, async (tx) => {
				if (recipe.items) {
					await this.deps.stockTransaction.productionOut(
						{
							locationId: wo.locationId,
							date: new Date(),
							referenceNo: `WO-OUT-${wo.id}`,
							notes: `Consumed for Work Order #${wo.id}`,
							items: recipe.items.map((item) => ({
								materialId: item.materialId,
								qty: money(item.qty)
									.mul(multiplier)
									.mul(money(1).plus(money(item.scrapPercentage).div(100)))
									.toString(),
							})),
						},
						actorId,
						tx,
					)
				}

				if (recipe.materialId) {
					await this.deps.stockTransaction.productionIn(
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

				const updated = await this.repo.update(
					id,
					{
						status: 'completed',
						actualQty: actualQty.toString(),
						totalCost: actualTotalCost.toString(),
						completedAt: new Date(),
					},
					actorId,
					tx,
				)
				if (!updated) throw ProductionError.updateFailed()
				return updated
			})

			await this.invalidate(id)
			return result
		})
	}
}

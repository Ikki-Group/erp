import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'

import { bento } from '@/core/cache'
import { paginate, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'

const cache = bento.namespace('production.work-order')
import { ConflictError, NotFoundError } from '@/core/http/errors'
import { transformDecimals } from '@/core/utils/decimal'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { workOrdersTable } from '@/db/schema/production'

import type { InventoryServiceModule } from '@/modules/inventory/service'
import type { RecipeService } from '@/modules/recipe/service/recipe.service'

import type {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
} from '../dto/work-order.dto'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Work Order with ID ${id} not found`, 'WORK_ORDER_NOT_FOUND'),
	notInProgress: (id: number) =>
		new ConflictError(`Work Order with ID ${id} is not in progress`, 'WORK_ORDER_STATUS_CONFLICT'),
}

export class WorkOrderService {
	constructor(
		private readonly recipeSvc: RecipeService,
		private readonly inventorySvc: InventoryServiceModule,
	) {}

	async handleList(
		filter: WorkOrderFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<WorkOrderDto>> {
		return record('WorkOrderService.handleList', async () => {
			const { locationId, status } = filter

			const where = and(
				isNull(workOrdersTable.deletedAt),
				locationId ? eq(workOrdersTable.locationId, locationId) : undefined,
				status ? eq(workOrdersTable.status, status) : undefined,
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(workOrdersTable)
						.where(where)
						.orderBy(desc(workOrdersTable.createdAt))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db
					.select({ count: sql<number>`count(*)` })
					.from(workOrdersTable)
					.where(where),
			})

			return {
				data: transformDecimals(result.data) as unknown as WorkOrderDto[],
				meta: result.meta,
			}
		})
	}

	async handleDetail(id: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleDetail', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db
						.select()
						.from(workOrdersTable)
						.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))

					const row = takeFirstOrThrow(
						result,
						`Work Order with ID ${id} not found`,
						'WORK_ORDER_NOT_FOUND',
					)
					return transformDecimals(row) as unknown as WorkOrderDto
				},
			})
		})
	}

	async handleCreate(data: WorkOrderCreateDto, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleCreate', async () => {
			const metadata = stampCreate(actorId)
			const result = await db
				.insert(workOrdersTable)
				.values({
					recipeId: data.recipeId,
					locationId: data.locationId,
					expectedQty: data.expectedQty.toString(),
					note: data.note ?? null,
					status: 'draft',
					actualQty: '0',
					totalCost: '0',
					...metadata,
				})
				.returning()

			const wo = transformDecimals(result[0]) as unknown as WorkOrderDto
			await this.clearCache()
			return wo
		})
	}

	async handleStart(id: number, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleStart', async () => {
			const wo = await this.handleDetail(id)
			if (wo.status !== 'draft') throw new ConflictError(`Only draft Work Orders can be started`)

			const metadata = stampUpdate(actorId)
			const result = await db
				.update(workOrdersTable)
				.set({ status: 'in_progress', startedAt: new Date(), ...metadata })
				.where(eq(workOrdersTable.id, id))
				.returning()

			const updatedWo = transformDecimals(result[0]) as unknown as WorkOrderDto
			await this.clearCache(id)
			return updatedWo
		})
	}

	async handleComplete(
		id: number,
		data: WorkOrderCompleteDto,
		actorId: number,
	): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleComplete', async () => {
			const wo = await this.handleDetail(id)
			if (wo.status !== 'in_progress') throw err.notInProgress(id)

			const recipe = await this.recipeSvc.getById(wo.recipeId)
			const actualQty = Number(data.actualQty)
			const targetQty = Number(recipe.targetQty)
			const multiplier = actualQty / (targetQty > 0 ? targetQty : 1)

			// Use simulated costs based on current WAC across all locations
			const costRes = await this.recipeSvc.handleCalculateCost(wo.recipeId)
			const actualTotalCost = Number(costRes.totalCost) * multiplier

			return db.transaction(async (tx) => {
				// 1. Consume raw materials
				if (recipe.items) {
					await this.inventorySvc.transaction.handleProductionOut(
						{
							locationId: wo.locationId,
							date: new Date(),
							referenceNo: `WO-OUT-${wo.id}`,
							notes: `Consumed for Work Order #${wo.id}`,
							items: recipe.items.map((item) => ({
								materialId: item.materialId,
								qty: Number(item.qty) * multiplier * (1 + Number(item.scrapPercentage) / 100),
							})),
						},
						actorId,
						tx,
					)
				}

				// 2. Add finished good
				if (recipe.materialId) {
					await this.inventorySvc.transaction.handleProductionIn(
						{
							locationId: wo.locationId,
							date: new Date(),
							referenceNo: `WO-IN-${wo.id}`,
							notes: `Produced from Work Order #${wo.id}`,
							items: [
								{
									materialId: recipe.materialId,
									qty: actualQty,
									unitCost: actualTotalCost / actualQty,
								},
							],
						},
						actorId,
						tx,
					)
				}

				// 3. Finalize Work Order
				const metadata = stampUpdate(actorId)
				const result = await tx
					.update(workOrdersTable)
					.set({
						status: 'completed',
						actualQty: actualQty.toString(),
						totalCost: actualTotalCost.toString(),
						completedAt: new Date(),
						...metadata,
					})
					.where(eq(workOrdersTable.id, id))
					.returning()

				const woResult = transformDecimals(result[0]) as unknown as WorkOrderDto
				await this.clearCache(id)
				return woResult
			})
		})
	}

	private async clearCache(id?: number) {
		const keys = ['list', 'count']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}

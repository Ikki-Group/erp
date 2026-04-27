import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { paginate, stampCreate, stampUpdate, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { workOrdersTable } from '@/db/schema/production'

import type { WorkOrderCreateDto, WorkOrderDto, WorkOrderFilterDto } from '../dto/work-order.dto'

const cache = bento.namespace('production.work-order')

export class WorkOrderRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<WorkOrderDto | undefined> {
		return record('WorkOrderRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [wo] = await db
						.select()
						.from(workOrdersTable)
						.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))

					if (!wo) return skip()
					return wo as unknown as WorkOrderDto
				},
			})
		})
	}

	async getListPaginated(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		return record('WorkOrderRepo.getListPaginated', async () => {
			const { locationId, status, page, limit } = filter

			const where = and(
				isNull(workOrdersTable.deletedAt),
				locationId ? eq(workOrdersTable.locationId, locationId) : undefined,
				status ? eq(workOrdersTable.status, status) : undefined,
			)

			const result = await paginate({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(workOrdersTable)
						.where(where)
						.orderBy(desc(workOrdersTable.createdAt))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(workOrdersTable).where(where),
			})

			return {
				...result,
				data: result.data as unknown as WorkOrderDto[],
			}
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: WorkOrderCreateDto, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [result] = await db
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

			if (!result) throw new Error('Failed to create work order')
			void this.#clearCache()
			return result as unknown as WorkOrderDto
		})
	}

	async update(
		id: number,
		data: Partial<typeof workOrdersTable.$inferInsert>,
		actorId: number,
	): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.update', async () => {
			const [result] = await db
				.update(workOrdersTable)
				.set({ ...data, ...stampUpdate(actorId) })
				.where(eq(workOrdersTable.id, id))
				.returning()

			if (!result) throw new Error('Failed to update work order')
			void this.#clearCache(id)
			return result as unknown as WorkOrderDto
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('WorkOrderRepo.softDelete', async () => {
			const [result] = await db
				.update(workOrdersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(workOrdersTable.id, id))
				.returning({ id: workOrdersTable.id })
			if (!result) throw new Error('Work Order not found')
			void this.#clearCache(id)
			return result
		})
	}
}

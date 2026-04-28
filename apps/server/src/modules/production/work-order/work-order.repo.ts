import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'
import { logger } from '@/core/logger'

import { workOrdersTable } from '@/db/schema/production'

import type { WorkOrderCreateDto, WorkOrderDto, WorkOrderFilterDto } from './work-order.dto'

const WORK_ORDER_CACHE_NAMESPACE = 'production.work-order'

export class WorkOrderRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(WORK_ORDER_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'WorkOrderRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<WorkOrderDto | undefined> {
		return record('WorkOrderRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [wo] = await this.db
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

			return paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(workOrdersTable)
						.where(where)
						.orderBy(desc(workOrdersTable.createdAt))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(workOrdersTable).where(where),
			}) as unknown as WithPaginationResult<WorkOrderDto>
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: WorkOrderCreateDto, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.create', async () => {
			const [result] = await this.db
				.insert(workOrdersTable)
				.values({
					...data,
					expectedQty: data.expectedQty.toString(),
					actualQty: '0',
					totalCost: '0',
					...stampCreate(actorId),
				})
				.returning()

			this.#clearCacheAsync()
			return result as unknown as WorkOrderDto
		})
	}

	async update(
		id: number,
		data: Partial<{
			expectedQty: string
			status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
			actualQty: string
			totalCost: string
			startedAt: Date
			completedAt: Date
			note: string | null
		}>,
		actorId: number,
	): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.update', async () => {
			const [result] = await this.db
				.update(workOrdersTable)
				.set({
					...data,
					...stampUpdate(actorId),
				})
				.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))
				.returning()

			this.#clearCacheAsync(id)
			return result as unknown as WorkOrderDto
		})
	}
}

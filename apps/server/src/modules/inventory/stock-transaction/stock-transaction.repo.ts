/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/require-await */
import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, ilike, isNull, lte, or, gte, inArray } from 'drizzle-orm'
import { z } from 'zod'

import {
	CACHE_KEY_DEFAULT,
	cacheEventBus,
	type CacheClient,
	type CacheProvider,
} from '@/core/cache'
import { paginate, takeFirst, type DbClient, type WithPaginationResult } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import { logger } from '@/core/logger'

import { materialsTable, stockTransactionsTable } from '@/db/schema'

import type {
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockTransactionDto,
} from './stock-transaction.dto'

const STOCK_TRANSACTION_CACHE_NAMESPACE = 'inventory.transaction'

export class StockTransactionRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(STOCK_TRANSACTION_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list]
		if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'StockTransactionRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockTransactionRepo.getListPaginated', async () => {
			const { locationId, materialId, type, search, dateFrom, dateTo, page, limit } = filter

			const key = CACHE_KEY_DEFAULT.list + JSON.stringify(filter)

			return this.cache.getOrSet({
				key,
				factory: async () => {
					const searchCondition = search
						? or(
								ilike(materialsTable.name, `%${search}%`),
								ilike(materialsTable.sku, `%${search}%`),
								ilike(stockTransactionsTable.referenceNo, `%${search}%`),
							)
						: undefined

					const dateCondition =
						dateFrom && dateTo
							? and(
									gte(stockTransactionsTable.date, dateFrom),
									lte(stockTransactionsTable.date, dateTo),
								)
							: dateFrom
								? gte(stockTransactionsTable.date, dateFrom)
								: dateTo
									? lte(stockTransactionsTable.date, dateTo)
									: undefined

					const where = and(
						isNull(stockTransactionsTable.deletedAt),
						locationId === undefined
							? undefined
							: eq(stockTransactionsTable.locationId, locationId),
						materialId === undefined
							? undefined
							: eq(stockTransactionsTable.materialId, materialId),
						type === undefined ? undefined : eq(stockTransactionsTable.type, type),
						dateCondition,
						searchCondition,
					)

					return paginate({
						data: ({ limit: l, offset }) =>
							this.db
								.select({
									id: stockTransactionsTable.id,
									materialId: stockTransactionsTable.materialId,
									locationId: stockTransactionsTable.locationId,
									type: stockTransactionsTable.type,
									date: stockTransactionsTable.date,
									referenceNo: stockTransactionsTable.referenceNo,
									notes: stockTransactionsTable.notes,
									qty: stockTransactionsTable.qty,
									unitCost: stockTransactionsTable.unitCost,
									totalCost: stockTransactionsTable.totalCost,
									counterpartLocationId: stockTransactionsTable.counterpartLocationId,
									transferId: stockTransactionsTable.transferId,
									runningQty: stockTransactionsTable.runningQty,
									runningAvgCost: stockTransactionsTable.runningAvgCost,
									createdAt: stockTransactionsTable.createdAt,
									updatedAt: stockTransactionsTable.updatedAt,
									createdBy: stockTransactionsTable.createdBy,
									updatedBy: stockTransactionsTable.updatedBy,
								})
								.from(stockTransactionsTable)
								.leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
								.where(where)
								.orderBy(desc(stockTransactionsTable.date), desc(stockTransactionsTable.id))
								.limit(l)
								.offset(offset),
						pq: { page, limit },
						countQuery: this.db
							.select({ count: count() })
							.from(stockTransactionsTable)
							.leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
							.where(where),
					}) as unknown as WithPaginationResult<StockTransactionSelectDto>
				},
			})
		})
	}

	async getById(id: number): Promise<StockTransactionDto | null> {
		return record('StockTransactionRepo.getById', async () => {
			const key = CACHE_KEY_DEFAULT.byId(id)
			const cached = await this.cache.getOrSet<StockTransactionDto | undefined>({
				key,
				factory: async ({ skip }) => {
					const result = await this.db
						.select()
						.from(stockTransactionsTable)
						.where(and(eq(stockTransactionsTable.id, id), isNull(stockTransactionsTable.deletedAt)))
						.limit(1)
						.then(takeFirst)

					return result ? (result as unknown as StockTransactionDto) : skip()
				},
			})
			return cached ?? null
		})
	}

	async getByIds(ids: number[]): Promise<StockTransactionDto[]> {
		if (ids.length === 0) return []
		return record('StockTransactionRepo.getByIds', async () => {
			return this.db
				.select()
				.from(stockTransactionsTable)
				.where(
					and(inArray(stockTransactionsTable.id, ids), isNull(stockTransactionsTable.deletedAt)),
				) as unknown as StockTransactionDto[]
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: typeof stockTransactionsTable.$inferInsert): Promise<StockTransactionDto> {
		return record('StockTransactionRepo.create', async () => {
			const [result] = await this.db.insert(stockTransactionsTable).values(data).returning()

			if (!result) throw new Error('Failed to create stock transaction')

			this.#clearCacheAsync()
			// Emit event for cross-domain invalidation (e.g., stock summary may need update)
			cacheEventBus.emit('stock-transaction.created', {
				id: result.id,
				materialId: result.materialId,
				locationId: result.locationId,
			})

			return result as unknown as StockTransactionDto
		})
	}

	async softDelete(id: number, deletedBy: number): Promise<{ id: number }> {
		return record('StockTransactionRepo.softDelete', async () => {
			const timestamp = new Date()
			await this.db
				.update(stockTransactionsTable)
				.set({ deletedAt: timestamp, deletedBy })
				.where(eq(stockTransactionsTable.id, id))

			this.#clearCacheAsync(id)
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('StockTransactionRepo.hardDelete', async () => {
			const result = await this.db
				.delete(stockTransactionsTable)
				.where(eq(stockTransactionsTable.id, id))
				.returning({ id: stockTransactionsTable.id })

			if (result.length === 0) throw new NotFoundError(`Stock transaction ${id} not found`)

			void this.#clearCache(id)
			return z.object({ id: z.number() }).parse(result[0])
		})
	}
}

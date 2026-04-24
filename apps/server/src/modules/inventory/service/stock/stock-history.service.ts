import { record } from '@elysiajs/opentelemetry'
import { and, eq, ilike, isNull, lte, or, gte } from 'drizzle-orm'

import { takeFirstOrThrow } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import { transformDecimals } from '@/core/utils/decimal'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { materialsTable, stockTransactionsTable } from '@/db/schema'

import { StockTransactionRepo } from '@/modules/inventory/repo'
import type {
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockTransactionDto,
} from '@/modules/inventory/dto'

export class StockHistoryService {
	private readonly repo = new StockTransactionRepo()

	/**
	 * List transactions with filters (paginated), enriched with material info.
	 */
	async handleList(
		filter: StockTransactionFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockHistoryService.handleList', async () => {
			const { locationId, materialId, type, search, dateFrom, dateTo } = filter

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
				locationId === undefined ? undefined : eq(stockTransactionsTable.locationId, locationId),
				materialId === undefined ? undefined : eq(stockTransactionsTable.materialId, materialId),
				type === undefined ? undefined : eq(stockTransactionsTable.type, type),
				dateCondition,
				searchCondition,
			)

			const result = await db.select().from(stockTransactionsTable).where(where)
			const data = transformDecimals(result) as unknown as StockTransactionSelectDto[]

			return { data, meta: { total: data.length, page: pq.page || 1, limit: pq.limit || 20 } }
		})
	}

	/**
	 * Get a single transaction by ID.
	 */
	async handleDetail(id: number): Promise<StockTransactionDto> {
		return record('StockHistoryService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw new NotFoundError('Stock transaction', id)
			return transformDecimals(result) as unknown as StockTransactionDto
		})
	}

	/**
	 * Marks a transaction as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleRemove', async () => {
			const existing = await this.repo.getById(id)
			if (!existing) throw new NotFoundError('Stock transaction', id)
			return this.repo.softDelete(id, actorId)
		})
	}

	/**
	 * Permanently deletes a transaction (Hard Delete).
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}

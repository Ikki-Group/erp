import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, ilike, isNull, lte, or, gte } from 'drizzle-orm'
import { paginate, takeFirstOrThrow } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import { transformDecimals } from '@/core/utils/decimal'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { materialsTable, stockTransactionsTable } from '@/db/schema'
import type {
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockTransactionDto,
} from '@/modules/inventory/dto'

export class StockHistoryService {
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

			const result = await paginate({
				data: ({ limit, offset }) =>
					db
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
							syncAt: stockTransactionsTable.syncAt,
							materialName: materialsTable.name,
							materialSku: materialsTable.sku,
						})
						.from(stockTransactionsTable)
						.innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
						.where(where)
						.orderBy(desc(stockTransactionsTable.date))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db
					.select({ count: count() })
					.from(stockTransactionsTable)
					.innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
					.where(where),
			})

			const data = transformDecimals(result.data) as unknown as StockTransactionSelectDto[]
			return { data, meta: result.meta }
		})
	}

	/**
	 * Get a single transaction by ID.
	 */
	async handleDetail(id: number): Promise<StockTransactionDto> {
		return record('StockHistoryService.handleDetail', async () => {
			const result = await db
				.select()
				.from(stockTransactionsTable)
				.where(and(eq(stockTransactionsTable.id, id), isNull(stockTransactionsTable.deletedAt)))
			const row = takeFirstOrThrow(
				result,
				`Transaction with ID ${id} not found`,
				'TRANSACTION_NOT_FOUND',
			)

			return transformDecimals(row) as unknown as StockTransactionDto
		})
	}

	/**
	 * Marks a transaction as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleRemove', async () => {
			const result = await db
				.update(stockTransactionsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(stockTransactionsTable.id, id))
				.returning({ id: stockTransactionsTable.id })

			if (result.length === 0) throw new NotFoundError(`Transaction with ID ${id} not found`)

			return { id }
		})
	}

	/**
	 * Permanently deletes a transaction (Hard Delete).
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('StockHistoryService.handleHardRemove', async () => {
			const result = await db
				.delete(stockTransactionsTable)
				.where(eq(stockTransactionsTable.id, id))
				.returning({ id: stockTransactionsTable.id })

			if (result.length === 0) throw new NotFoundError(`Transaction with ID ${id} not found`)

			return { id }
		})
	}
}

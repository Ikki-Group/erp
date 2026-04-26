import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, ilike, isNull, lte, or, gte, inArray } from 'drizzle-orm'

import { paginate } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { materialsTable, stockTransactionsTable } from '@/db/schema'

import type {
	StockTransactionFilterDto,
	StockTransactionSelectDto,
	StockTransactionDto,
} from '@/modules/inventory/dto'

export class StockTransactionRepo {
	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: StockTransactionFilterDto,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		return record('StockTransactionRepo.getListPaginated', async () => {
			const { locationId, materialId, type, search, dateFrom, dateTo, page, limit } = filter

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

			return paginate({
				data: ({ limit: l, offset }) =>
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
						})
						.from(stockTransactionsTable)
						.leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
						.where(where)
						.orderBy(desc(stockTransactionsTable.date), desc(stockTransactionsTable.id))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(stockTransactionsTable).leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id)).where(where),
			}) as unknown as WithPaginationResult<StockTransactionSelectDto>
		})
	}

	async getById(id: number): Promise<StockTransactionDto | null> {
		return record('StockTransactionRepo.getById', async () => {
			const result = await db
				.select()
				.from(stockTransactionsTable)
				.where(and(eq(stockTransactionsTable.id, id), isNull(stockTransactionsTable.deletedAt)))

			return (result[0] ?? null) as unknown as StockTransactionDto | null
		})
	}

	async getByIds(ids: number[]): Promise<StockTransactionDto[]> {
		if (ids.length === 0) return []
		return record('StockTransactionRepo.getByIds', async () => {
			return db
				.select()
				.from(stockTransactionsTable)
				.where(and(inArray(stockTransactionsTable.id, ids), isNull(stockTransactionsTable.deletedAt))) as unknown as StockTransactionDto[]
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: typeof stockTransactionsTable.$inferInsert): Promise<StockTransactionDto> {
		return record('StockTransactionRepo.create', async () => {
			const [result] = await db
				.insert(stockTransactionsTable)
				.values(data)
				.returning()

			if (!result) throw new Error('Failed to create stock transaction')
			return result as unknown as StockTransactionDto
		})
	}

	async softDelete(id: number, deletedBy: number): Promise<{ id: number }> {
		return record('StockTransactionRepo.softDelete', async () => {
			const timestamp = new Date()
			await db
				.update(stockTransactionsTable)
				.set({ deletedAt: timestamp, deletedBy })
				.where(eq(stockTransactionsTable.id, id))

			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('StockTransactionRepo.hardDelete', async () => {
			const result = await db
				.delete(stockTransactionsTable)
				.where(eq(stockTransactionsTable.id, id))
				.returning({ id: stockTransactionsTable.id })

			if (result.length === 0) throw new NotFoundError(`Stock transaction ${id} not found`)
			return result[0] as { id: number }
		})
	}
}

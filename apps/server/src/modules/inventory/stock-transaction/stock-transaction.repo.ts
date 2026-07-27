import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, or, SQL } from 'drizzle-orm'

import { materialsTable, stockTransactionsTable } from '@/db/schema'

import { paginate, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	StockTransactionDto,
	StockTransactionFilterDto,
	StockTransactionSelectDto,
} from './stock-transaction.contract'

type StockTransactionInsert = typeof stockTransactionsTable.$inferInsert

export interface IStockTransactionRepo {
	readonly db: DbContext
	findPage(
		filter: StockTransactionFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<StockTransactionSelectDto>>
	findById(id: number, db?: DbContext): Promise<StockTransactionDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<StockTransactionDto[]>
	insert(data: StockTransactionInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: StockTransactionInsert[], db?: DbContext): Promise<void>
	softDelete(id: number, deletedBy: number, db?: DbContext): Promise<EntityRef | undefined>
	hardDelete(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class StockTransactionRepo implements IStockTransactionRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: StockTransactionFilterDto): SQL | undefined {
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
				? and(gte(stockTransactionsTable.date, dateFrom), lte(stockTransactionsTable.date, dateTo))
				: dateFrom
					? gte(stockTransactionsTable.date, dateFrom)
					: dateTo
						? lte(stockTransactionsTable.date, dateTo)
						: undefined

		return and(
			isNull(stockTransactionsTable.deletedAt),
			locationId === undefined ? undefined : eq(stockTransactionsTable.locationId, locationId),
			materialId === undefined ? undefined : eq(stockTransactionsTable.materialId, materialId),
			type === undefined ? undefined : eq(stockTransactionsTable.type, type),
			dateCondition,
			searchCondition,
		)
	}

	async findPage(
		filter: StockTransactionFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<StockTransactionSelectDto>> {
		const where = this.#buildWhere(filter)

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Drizzle raw SQL result matches contract shape
		return paginate({
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
						materialName: materialsTable.name,
						materialSku: materialsTable.sku,
					})
					.from(stockTransactionsTable)
					.leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
					.where(where)
					.orderBy(desc(stockTransactionsTable.date), desc(stockTransactionsTable.id))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () =>
				db
					.select({ count: count() })
					.from(stockTransactionsTable)
					.leftJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
					.where(where),
		}) as Promise<WithPaginationResult<StockTransactionSelectDto>>
	}

	async findById(id: number, db: DbContext = this.db): Promise<StockTransactionDto | undefined> {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Drizzle raw SQL result matches contract shape
		return db
			.select()
			.from(stockTransactionsTable)
			.where(and(eq(stockTransactionsTable.id, id), isNull(stockTransactionsTable.deletedAt)))
			.limit(1)
			.then(takeFirst) as Promise<StockTransactionDto | undefined>
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<StockTransactionDto[]> {
		if (ids.length === 0) return []
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Drizzle raw SQL result matches contract shape
		return db
			.select()
			.from(stockTransactionsTable)
			.where(
				and(inArray(stockTransactionsTable.id, ids), isNull(stockTransactionsTable.deletedAt)),
			) as Promise<StockTransactionDto[]>
	}

	async insert(
		data: StockTransactionInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(stockTransactionsTable)
			.values(data)
			.returning({ id: stockTransactionsTable.id })
		return res
	}

	async insertMany(items: StockTransactionInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(stockTransactionsTable).values(items)
	}

	async softDelete(
		id: number,
		deletedBy: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const timestamp = new Date()
		const [res] = await db
			.update(stockTransactionsTable)
			.set({ deletedAt: timestamp, deletedBy })
			.where(eq(stockTransactionsTable.id, id))
			.returning({ id: stockTransactionsTable.id })
		return res
	}

	async hardDelete(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(stockTransactionsTable)
			.where(eq(stockTransactionsTable.id, id))
			.returning({ id: stockTransactionsTable.id })
		return res
	}
}

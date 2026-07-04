import { and, count, eq, gte, isNull, lte, or, SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { stockTransferItemsTable, stockTransfersTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, type DbContext } from '@/infra/database'
import { stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	StockTransferDto,
	StockTransferFilterDto,
	StockTransferSelectDto,
	TransferStatus,
} from './stock-transfer.contract'

type StockTransferInsert = typeof stockTransfersTable.$inferInsert
type StockTransferUpdate = PgUpdateSetSource<typeof stockTransfersTable>

export interface StockTransferItemInsert {
	materialId: number
	itemName: string
	quantity: string
	unitCost: string
	totalCost: string
	notes?: string | null
	createdBy: number
	updatedBy: number
	createdAt?: Date
	updatedAt?: Date
}

export interface IStockTransferRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<StockTransferDto | undefined>
	findPage(filter: StockTransferFilterDto, db?: DbContext): Promise<WithPaginationResult<StockTransferSelectDto>>
	insert(data: StockTransferInsert, items: StockTransferItemInsert[], db?: DbContext): Promise<EntityRef | undefined>
	update(
		id: number,
		data: StockTransferUpdate,
		items: StockTransferItemInsert[] | undefined,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	softDelete(id: number, deletedBy: number, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(id: number, status: TransferStatus, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	updateStatusWithReason(
		id: number,
		status: TransferStatus,
		reason: string,
		actorId: number,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	updateReceivedDate(id: number, receivedDate: Date, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class StockTransferRepo implements IStockTransferRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: StockTransferFilterDto): SQL | undefined {
		const { q, sourceLocationId, destinationLocationId, status, dateFrom, dateTo } = filter
		return and(
			isNull(stockTransfersTable.deletedAt),
			q === undefined ? undefined : or(searchFilter(stockTransfersTable.referenceNo, q)),
			sourceLocationId === undefined
				? undefined
				: eq(stockTransfersTable.sourceLocationId, sourceLocationId),
			destinationLocationId === undefined
				? undefined
				: eq(stockTransfersTable.destinationLocationId, destinationLocationId),
			status === undefined ? undefined : eq(stockTransfersTable.status, status),
			dateFrom === undefined ? undefined : gte(stockTransfersTable.transferDate, dateFrom),
			dateTo === undefined ? undefined : lte(stockTransfersTable.transferDate, dateTo),
		)
	}

	async findById(id: number, db: DbContext = this.db): Promise<StockTransferDto | undefined> {
		const [transfer] = await db
			.select()
			.from(stockTransfersTable)
			.where(and(eq(stockTransfersTable.id, id), isNull(stockTransfersTable.deletedAt)))
			.limit(1)

		if (!transfer) return undefined

		const items = await db
			.select()
			.from(stockTransferItemsTable)
			.where(
				and(eq(stockTransferItemsTable.transferId, id), isNull(stockTransferItemsTable.deletedAt)),
			)

		return { ...transfer, items } as StockTransferDto
	}

	async findPage(
		filter: StockTransferFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<StockTransferSelectDto>> {
		const where = this.#buildWhere(filter)

		return paginate({
			data: async ({ limit, offset }) => {
				const rows = await db
					.select()
					.from(stockTransfersTable)
					.where(where)
					.orderBy(sortBy(stockTransfersTable.createdAt, 'desc'))
					.limit(limit)
					.offset(offset)
				return rows as StockTransferSelectDto[]
			},
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(stockTransfersTable).where(where),
		})
	}

	async insert(
		data: StockTransferInsert,
		items: StockTransferItemInsert[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [inserted] = await db
			.insert(stockTransfersTable)
			.values(data)
			.returning({ id: stockTransfersTable.id })

		if (!inserted) return undefined

		if (items.length > 0) {
			const itemValues = items.map((item) => ({
				...item,
				transferId: inserted.id,
			}))
			await db.insert(stockTransferItemsTable).values(itemValues)
		}

		return inserted
	}

	async update(
		id: number,
		data: StockTransferUpdate,
		items: StockTransferItemInsert[] | undefined,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [updated] = await db
			.update(stockTransfersTable)
			.set(data)
			.where(eq(stockTransfersTable.id, id))
			.returning({ id: stockTransfersTable.id })

		if (!updated) return undefined

		if (items !== undefined) {
			await db.delete(stockTransferItemsTable).where(eq(stockTransferItemsTable.transferId, id))
			if (items.length > 0) {
				const itemValues = items.map((item) => ({
					...item,
					transferId: id,
				}))
				await db.insert(stockTransferItemsTable).values(itemValues)
			}
		}

		return updated
	}

	async softDelete(id: number, deletedBy: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(stockTransfersTable)
			.set({ deletedAt: new Date(), deletedBy })
			.where(eq(stockTransfersTable.id, id))
			.returning({ id: stockTransfersTable.id })
		return result
	}

	async updateStatus(
		id: number,
		status: TransferStatus,
		actorId: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const updateMeta = stampUpdate(actorId)
		const [result] = await db
			.update(stockTransfersTable)
			.set({ status, ...updateMeta })
			.where(eq(stockTransfersTable.id, id))
			.returning({ id: stockTransfersTable.id })
		return result
	}

	async updateStatusWithReason(
		id: number,
		status: TransferStatus,
		reason: string,
		actorId: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const updateMeta = stampUpdate(actorId)
		const [result] = await db
			.update(stockTransfersTable)
			.set({ status, rejectionReason: reason, ...updateMeta })
			.where(eq(stockTransfersTable.id, id))
			.returning({ id: stockTransfersTable.id })
		return result
	}

	async updateReceivedDate(
		id: number,
		receivedDate: Date,
		actorId: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const updateMeta = stampUpdate(actorId)
		const [result] = await db
			.update(stockTransfersTable)
			.set({ receivedDate, ...updateMeta })
			.where(eq(stockTransfersTable.id, id))
			.returning({ id: stockTransfersTable.id })
		return result
	}
}

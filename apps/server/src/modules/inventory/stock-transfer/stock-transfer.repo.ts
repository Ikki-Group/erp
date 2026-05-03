/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gte, isNull, lte, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'

import { stockTransferItemsTable, stockTransfersTable } from '@/db/schema'

import {
	StockTransferCreateDto,
	StockTransferDto,
	StockTransferFilterDto,
	StockTransferSelectDto,
	StockTransferUpdateDto,
} from './stock-transfer.dto'

export class StockTransferRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<StockTransferDto | undefined> {
		return record('StockTransferRepo.getById', async () => {
			const [transfer] = await this.db
				.select()
				.from(stockTransfersTable)
				.where(and(eq(stockTransfersTable.id, id), isNull(stockTransfersTable.deletedAt)))

			if (!transfer) return undefined

			const items = await this.db
				.select()
				.from(stockTransferItemsTable)
				.where(
					and(
						eq(stockTransferItemsTable.transferId, id),
						isNull(stockTransferItemsTable.deletedAt),
					),
				)

			return StockTransferDto.parse({ ...transfer, items })
		})
	}

	async getListPaginated(
		filter: StockTransferFilterDto,
	): Promise<WithPaginationResult<StockTransferSelectDto>> {
		return record('StockTransferRepo.getListPaginated', async () => {
			const { q, page, limit, sourceLocationId, destinationLocationId, status, dateFrom, dateTo } =
				filter
			const where = and(
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

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(stockTransfersTable)
						.where(where)
						.orderBy(sortBy(stockTransfersTable.createdAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => StockTransferSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(stockTransfersTable).where(where),
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: StockTransferCreateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferRepo.create', async () => {
			const result = await this.db.transaction(async (tx) => {
				const { items, ...transferData } = data
				const meta = stampCreate(actorId)

				const [insertedTransfer] = await tx
					.insert(stockTransfersTable)
					.values({
						...transferData,
						...meta,
					})
					.returning({ id: stockTransfersTable.id })

				if (!insertedTransfer) throw new Error('Stock transfer creation failed')

				const itemValues = items.map((item) => ({
					transferId: insertedTransfer.id,
					materialId: item.materialId,
					itemName: item.itemName,
					quantity: item.quantity?.toString(),
					unitCost: item.unitCost?.toString(),
					totalCost: item.totalCost?.toString(),
					notes: item.notes,
					...meta,
				}))

				await tx.insert(stockTransferItemsTable).values(itemValues)

				return insertedTransfer
			})
			return result
		})
	}

	async update(data: StockTransferUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferRepo.update', async () => {
			const { id, items, ...transferData } = data
			const updateMeta = stampUpdate(actorId)
			const createMeta = stampCreate(actorId)

			const result = await this.db.transaction(async (tx) => {
				await tx
					.update(stockTransfersTable)
					.set({
						...transferData,
						...updateMeta,
					})
					.where(eq(stockTransfersTable.id, id))

				if (items) {
					await tx.delete(stockTransferItemsTable).where(eq(stockTransferItemsTable.transferId, id))
					if (items.length > 0) {
						const itemValues = items.map((item) => ({
							transferId: id,
							materialId: item.materialId,
							itemName: item.itemName,
							quantity: item.quantity?.toString(),
							unitCost: item.unitCost?.toString(),
							totalCost: item.totalCost?.toString(),
							notes: item.notes,
							...createMeta,
						}))
						await tx.insert(stockTransferItemsTable).values(itemValues)
					}
				}

				return { id }
			})
			return result
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockTransferRepo.softDelete', async () => {
			const [result] = await this.db
				.update(stockTransfersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(stockTransfersTable.id, id))
				.returning({ id: stockTransfersTable.id })
			if (!result) throw new Error('Stock transfer not found')
			return result
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('StockTransferRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(stockTransfersTable)
				.where(eq(stockTransfersTable.id, id))
				.returning({ id: stockTransfersTable.id })
			if (!result) throw new Error('Stock transfer not found')
			return result
		})
	}

	async updateStatus(id: number, status: string, actorId: number): Promise<{ id: number }> {
		return record('StockTransferRepo.updateStatus', async () => {
			const updateMeta = stampUpdate(actorId)
			const [result] = await this.db
				.update(stockTransfersTable)
				.set({ status: status as any, ...updateMeta })
				.where(eq(stockTransfersTable.id, id))
				.returning({ id: stockTransfersTable.id })
			if (!result) throw new Error('Stock transfer not found')
			return result
		})
	}

	async updateWithRejectionReason(
		id: number,
		status: string,
		rejectionReason: string,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferRepo.updateWithRejectionReason', async () => {
			const updateMeta = stampUpdate(actorId)
			const [result] = await this.db
				.update(stockTransfersTable)
				.set({ status: status as any, rejectionReason, ...updateMeta })
				.where(eq(stockTransfersTable.id, id))
				.returning({ id: stockTransfersTable.id })
			if (!result) throw new Error('Stock transfer not found')
			return result
		})
	}

	async updateReceivedDate(
		id: number,
		receivedDate: Date,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferRepo.updateReceivedDate', async () => {
			const updateMeta = stampUpdate(actorId)
			const [result] = await this.db
				.update(stockTransfersTable)
				.set({ receivedDate, ...updateMeta })
				.where(eq(stockTransfersTable.id, id))
				.returning({ id: stockTransfersTable.id })
			if (!result) throw new Error('Stock transfer not found')
			return result
		})
	}
}

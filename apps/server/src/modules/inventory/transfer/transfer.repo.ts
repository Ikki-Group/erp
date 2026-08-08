import { transferLines, transferRequests } from '@/db/schema/inventory.ts'

import {
	allOf,
	eq,
	eqIf,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	TransferDetailDto,
	TransferDto,
	TransferFilterDto,
	TransferLineDto,
	TransferStatusEnum,
} from './transfer.contract.ts'

// ─── Types ───

type TransferRow = typeof transferRequests.$inferSelect
type TransferInsert = typeof transferRequests.$inferInsert
type TransferLineRow = typeof transferLines.$inferSelect
type TransferLineInsert = typeof transferLines.$inferInsert

function toTransferDto(row: TransferRow): TransferDto {
	return {
		id: row.id,
		transferNo: row.transferNo,
		fromLocationId: row.fromLocationId,
		toLocationId: row.toLocationId,
		status: row.status,
		notes: row.notes,
		requestedBy: row.requestedBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toTransferLineDto(row: TransferLineRow): TransferLineDto {
	return {
		id: row.id,
		transferId: row.transferId,
		materialId: row.materialId,
		requestedQty: row.requestedQty,
		shippedQty: row.shippedQty,
		receivedQty: row.receivedQty,
		uomId: row.uomId,
	}
}

// ─── Interface ───

export interface ITransferRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<TransferDto | undefined>
	findDetailById(id: number, db?: DbContext): Promise<TransferDetailDto | undefined>
	findPage(filter: TransferFilterDto, db?: DbContext): Promise<WithPaginationResult<TransferDto>>
	insert(data: TransferInsert, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(
		id: number,
		status: TransferStatusEnum,
		updatedBy: number,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	insertLines(lines: TransferLineInsert[], db?: DbContext): Promise<void>
	findLinesByTransferId(transferId: number, db?: DbContext): Promise<TransferLineDto[]>
	updateLineShippedQty(transferId: number, db?: DbContext): Promise<void>
	updateLineReceivedQty(lineId: number, receivedQty: string, db?: DbContext): Promise<void>
}

// ─── Implementation ───

export class TransferRepo implements ITransferRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<TransferDto | undefined> {
		const row = await db
			.select()
			.from(transferRequests)
			.where(eq(transferRequests.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toTransferDto(row) : undefined
	}

	async findDetailById(
		id: number,
		db: DbContext = this.db,
	): Promise<TransferDetailDto | undefined> {
		const transfer = await this.findById(id, db)
		if (!transfer) return undefined

		const lines = await this.findLinesByTransferId(id, db)
		return { ...transfer, lines }
	}

	async findPage(
		filter: TransferFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<TransferDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: transferRequests.id,
				transferNo: transferRequests.transferNo,
				fromLocationId: transferRequests.fromLocationId,
				toLocationId: transferRequests.toLocationId,
				status: transferRequests.status,
				notes: transferRequests.notes,
				requestedBy: transferRequests.requestedBy,
				createdAt: transferRequests.createdAt,
				updatedAt: transferRequests.updatedAt,
				createdBy: transferRequests.createdBy,
				updatedBy: transferRequests.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(transferRequests)
			.where(where)
			.orderBy(sql`${transferRequests.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toTransferDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: TransferInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(transferRequests)
			.values(data)
			.returning({ id: transferRequests.id })
		return result
	}

	async updateStatus(
		id: number,
		status: TransferStatusEnum,
		updatedBy: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(transferRequests)
			.set({ status, updatedBy, updatedAt: new Date() })
			.where(eq(transferRequests.id, id))
			.returning({ id: transferRequests.id })
		return result
	}

	async insertLines(lines: TransferLineInsert[], db: DbContext = this.db): Promise<void> {
		if (lines.length === 0) return
		await db.insert(transferLines).values(lines)
	}

	async findLinesByTransferId(
		transferId: number,
		db: DbContext = this.db,
	): Promise<TransferLineDto[]> {
		const rows = await db
			.select()
			.from(transferLines)
			.where(eq(transferLines.transferId, transferId))
		return rows.map(toTransferLineDto)
	}

	async updateLineShippedQty(transferId: number, db: DbContext = this.db): Promise<void> {
		// Set shippedQty = requestedQty for all lines on ship
		await db
			.update(transferLines)
			.set({ shippedQty: sql`${transferLines.requestedQty}` })
			.where(eq(transferLines.transferId, transferId))
	}

	async updateLineReceivedQty(
		lineId: number,
		receivedQty: string,
		db: DbContext = this.db,
	): Promise<void> {
		await db.update(transferLines).set({ receivedQty }).where(eq(transferLines.id, lineId))
	}

	// ─── Private ───

	#buildWhere(filter: TransferFilterDto) {
		return allOf(
			eqIf(transferRequests.status, filter.status),
			filter.locationId
				? sql`(${transferRequests.fromLocationId} = ${filter.locationId} OR ${transferRequests.toLocationId} = ${filter.locationId})`
				: undefined,
		)
	}
}

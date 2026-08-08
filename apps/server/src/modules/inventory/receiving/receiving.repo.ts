import { receivingLines, receivings } from '@/db/schema/inventory.ts'

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
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingLineDto,
	ReceivingStatusEnum,
} from './receiving.contract.ts'

// ─── Types ───

type ReceivingRow = typeof receivings.$inferSelect
type ReceivingInsert = typeof receivings.$inferInsert
type ReceivingLineRow = typeof receivingLines.$inferSelect
type ReceivingLineInsert = typeof receivingLines.$inferInsert

function toReceivingDto(row: ReceivingRow): ReceivingDto {
	return {
		id: row.id,
		receivingNo: row.receivingNo,
		locationId: row.locationId,
		supplierId: row.supplierId,
		status: row.status,
		notes: row.notes,
		receivedBy: row.receivedBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toReceivingLineDto(row: ReceivingLineRow): ReceivingLineDto {
	return {
		id: row.id,
		receivingId: row.receivingId,
		materialId: row.materialId,
		quantity: row.quantity,
		unitCost: row.unitCost,
		uomId: row.uomId,
	}
}

// ─── Interface ───

export interface IReceivingRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<ReceivingDto | undefined>
	findDetailById(id: number, db?: DbContext): Promise<ReceivingDetailDto | undefined>
	findPage(filter: ReceivingFilterDto, db?: DbContext): Promise<WithPaginationResult<ReceivingDto>>
	insert(data: ReceivingInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: Partial<ReceivingInsert>, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(
		id: number,
		status: ReceivingStatusEnum,
		updatedBy: number,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	insertLines(lines: ReceivingLineInsert[], db?: DbContext): Promise<void>
	replaceLines(receivingId: number, lines: ReceivingLineInsert[], db?: DbContext): Promise<void>
	findLinesByReceivingId(receivingId: number, db?: DbContext): Promise<ReceivingLineDto[]>
}

// ─── Implementation ───

export class ReceivingRepo implements IReceivingRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<ReceivingDto | undefined> {
		const row = await db
			.select()
			.from(receivings)
			.where(eq(receivings.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toReceivingDto(row) : undefined
	}

	async findDetailById(
		id: number,
		db: DbContext = this.db,
	): Promise<ReceivingDetailDto | undefined> {
		const receiving = await this.findById(id, db)
		if (!receiving) return undefined

		const lines = await this.findLinesByReceivingId(id, db)
		return { ...receiving, lines }
	}

	async findPage(
		filter: ReceivingFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ReceivingDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: receivings.id,
				receivingNo: receivings.receivingNo,
				locationId: receivings.locationId,
				supplierId: receivings.supplierId,
				status: receivings.status,
				notes: receivings.notes,
				receivedBy: receivings.receivedBy,
				createdAt: receivings.createdAt,
				updatedAt: receivings.updatedAt,
				createdBy: receivings.createdBy,
				updatedBy: receivings.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(receivings)
			.where(where)
			.orderBy(sql`${receivings.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toReceivingDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: ReceivingInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(receivings).values(data).returning({ id: receivings.id })
		return result
	}

	async update(
		id: number,
		data: Partial<ReceivingInsert>,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(receivings)
			.set(data)
			.where(eq(receivings.id, id))
			.returning({ id: receivings.id })
		return result
	}

	async updateStatus(
		id: number,
		status: ReceivingStatusEnum,
		updatedBy: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(receivings)
			.set({ status, updatedBy, updatedAt: new Date() })
			.where(eq(receivings.id, id))
			.returning({ id: receivings.id })
		return result
	}

	async insertLines(lines: ReceivingLineInsert[], db: DbContext = this.db): Promise<void> {
		if (lines.length === 0) return
		await db.insert(receivingLines).values(lines)
	}

	async replaceLines(
		receivingId: number,
		lines: ReceivingLineInsert[],
		db: DbContext = this.db,
	): Promise<void> {
		await db.delete(receivingLines).where(eq(receivingLines.receivingId, receivingId))
		if (lines.length > 0) {
			await db.insert(receivingLines).values(lines)
		}
	}

	async findLinesByReceivingId(
		receivingId: number,
		db: DbContext = this.db,
	): Promise<ReceivingLineDto[]> {
		const rows = await db
			.select()
			.from(receivingLines)
			.where(eq(receivingLines.receivingId, receivingId))
		return rows.map(toReceivingLineDto)
	}

	// ─── Private ───

	#buildWhere(filter: ReceivingFilterDto) {
		return allOf(
			eqIf(receivings.locationId, filter.locationId),
			eqIf(receivings.supplierId, filter.supplierId),
			eqIf(receivings.status, filter.status),
		)
	}
}

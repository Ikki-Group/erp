import { stockOpnameLines, stockOpnames } from '@/db/schema/inventory.ts'

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
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameLineDto,
} from './opname.contract.ts'

// ─── Types ───

type OpnameRow = typeof stockOpnames.$inferSelect
type OpnameInsert = typeof stockOpnames.$inferInsert
type OpnameLineRow = typeof stockOpnameLines.$inferSelect
type OpnameLineInsert = typeof stockOpnameLines.$inferInsert

function toOpnameDto(row: OpnameRow): OpnameDto {
	return {
		id: row.id,
		opnameNo: row.opnameNo,
		locationId: row.locationId,
		// DB enum is wider (draft/in_progress/completed/cancelled); we only use draft/completed
		// but the Zod output type accepts any string — safe to pass through
		status: row.status,
		startedAt: row.startedAt,
		completedAt: row.completedAt,
		conductedBy: row.conductedBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toOpnameLineDto(row: OpnameLineRow): OpnameLineDto {
	return {
		id: row.id,
		opnameId: row.opnameId,
		materialId: row.materialId,
		systemQty: row.systemQty,
		actualQty: row.actualQty,
		reason: row.reason,
	}
}

// ─── Interface ───

export interface IOpnameRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<OpnameDto | undefined>
	findDetailById(id: number, db?: DbContext): Promise<OpnameDetailDto | undefined>
	findPage(filter: OpnameFilterDto, db?: DbContext): Promise<WithPaginationResult<OpnameDto>>
	insert(data: OpnameInsert, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(
		id: number,
		status: OpnameRow['status'],
		updatedBy: number,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	insertLines(lines: OpnameLineInsert[], db?: DbContext): Promise<void>
	updateLineCounts(
		opnameId: number,
		lines: Array<{ materialId: number; actualQty: string; reason?: string | null }>,
		db?: DbContext,
	): Promise<void>
	findLinesByOpnameId(opnameId: number, db?: DbContext): Promise<OpnameLineDto[]>
}

// ─── Implementation ───

export class OpnameRepo implements IOpnameRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<OpnameDto | undefined> {
		const row = await db
			.select()
			.from(stockOpnames)
			.where(eq(stockOpnames.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toOpnameDto(row) : undefined
	}

	async findDetailById(id: number, db: DbContext = this.db): Promise<OpnameDetailDto | undefined> {
		const opname = await this.findById(id, db)
		if (!opname) return undefined

		const lines = await this.findLinesByOpnameId(id, db)
		return { ...opname, lines }
	}

	async findPage(
		filter: OpnameFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<OpnameDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: stockOpnames.id,
				opnameNo: stockOpnames.opnameNo,
				locationId: stockOpnames.locationId,
				status: stockOpnames.status,
				startedAt: stockOpnames.startedAt,
				completedAt: stockOpnames.completedAt,
				conductedBy: stockOpnames.conductedBy,
				createdAt: stockOpnames.createdAt,
				updatedAt: stockOpnames.updatedAt,
				createdBy: stockOpnames.createdBy,
				updatedBy: stockOpnames.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(stockOpnames)
			.where(where)
			.orderBy(sql`${stockOpnames.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toOpnameDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: OpnameInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(stockOpnames).values(data).returning({ id: stockOpnames.id })
		return result
	}

	async updateStatus(
		id: number,
		status: OpnameRow['status'],
		updatedBy: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(stockOpnames)
			.set({ status, updatedBy, updatedAt: new Date() })
			.where(eq(stockOpnames.id, id))
			.returning({ id: stockOpnames.id })
		return result
	}

	async insertLines(lines: OpnameLineInsert[], db: DbContext = this.db): Promise<void> {
		if (lines.length === 0) return
		await db.insert(stockOpnameLines).values(lines)
	}

	async updateLineCounts(
		opnameId: number,
		lines: Array<{ materialId: number; actualQty: string; reason?: string | null }>,
		db: DbContext = this.db,
	): Promise<void> {
		for (const line of lines) {
			await db
				.update(stockOpnameLines)
				.set({ actualQty: line.actualQty, reason: line.reason ?? null })
				.where(
					allOf(
						eq(stockOpnameLines.opnameId, opnameId),
						eq(stockOpnameLines.materialId, line.materialId),
					),
				)
		}
	}

	async findLinesByOpnameId(opnameId: number, db: DbContext = this.db): Promise<OpnameLineDto[]> {
		const rows = await db
			.select()
			.from(stockOpnameLines)
			.where(eq(stockOpnameLines.opnameId, opnameId))
		return rows.map(toOpnameLineDto)
	}

	// ─── Private ───

	#buildWhere(filter: OpnameFilterDto) {
		return allOf(
			eqIf(stockOpnames.locationId, filter.locationId),
			eqIf(stockOpnames.status, filter.status),
		)
	}
}

import { uoms, uomConversions } from '@/db/schema/uom.ts'

import {
	allOf,
	buildPaginationMeta,
	eq,
	eqIf,
	inArray,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { UomConversionDto, UomDto, UomFilterDto } from './uom.contract.ts'

// ─── Types ───

type UomInsert = typeof uoms.$inferInsert
type UomUpdate = Partial<Omit<UomInsert, 'id'>>
type UomRow = typeof uoms.$inferSelect

type UomConversionInsert = typeof uomConversions.$inferInsert
type UomConversionRow = typeof uomConversions.$inferSelect

// ─── Mappers ───

function toDto(row: UomRow): UomDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		category: row.category,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toConversionDto(row: UomConversionRow): UomConversionDto {
	return {
		id: row.id,
		fromUomId: row.fromUomId,
		toUomId: row.toUomId,
		factor: row.factor,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IUomRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<UomDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<UomDto[]>
	findMany(db?: DbContext): Promise<UomDto[]>
	findPage(filter: UomFilterDto, db?: DbContext): Promise<WithPaginationResult<UomDto>>
	insert(data: UomInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: UomUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	findAllConversions(db?: DbContext): Promise<UomConversionDto[]>
	findConversionById(id: number, db?: DbContext): Promise<UomConversionDto | undefined>
	insertConversion(data: UomConversionInsert, db?: DbContext): Promise<EntityRef | undefined>
	removeConversion(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class UomRepo implements IUomRepo {
	constructor(readonly db: DbContext) {}

	// ─── UoM ───

	async findById(id: number, db: DbContext = this.db): Promise<UomDto | undefined> {
		const row = await db
			.select()
			.from(uoms)
			.where(eq(uoms.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<UomDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(uoms).where(inArray(uoms.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext = this.db): Promise<UomDto[]> {
		const rows = await db.select().from(uoms)
		return rows.map(toDto)
	}

	async findPage(
		filter: UomFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<UomDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: uoms.id,
				code: uoms.code,
				name: uoms.name,
				category: uoms.category,
				createdAt: uoms.createdAt,
				updatedAt: uoms.updatedAt,
				createdBy: uoms.createdBy,
				updatedBy: uoms.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(uoms)
			.where(where)
			.orderBy(sql`${uoms.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: UomInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(uoms).values(data).returning({ id: uoms.id })
		return result
	}

	async update(
		id: number,
		data: UomUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(uoms)
			.set(data)
			.where(eq(uoms.id, id))
			.returning({ id: uoms.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(uoms)
			.where(eq(uoms.id, id))
			.returning({ id: uoms.id })
		return result
	}

	// ─── Conversions ───

	async findAllConversions(db: DbContext = this.db): Promise<UomConversionDto[]> {
		const rows = await db.select().from(uomConversions)
		return rows.map(toConversionDto)
	}

	async findConversionById(
		id: number,
		db: DbContext = this.db,
	): Promise<UomConversionDto | undefined> {
		const row = await db
			.select()
			.from(uomConversions)
			.where(eq(uomConversions.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toConversionDto(row) : undefined
	}

	async insertConversion(
		data: UomConversionInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(uomConversions)
			.values(data)
			.returning({ id: uomConversions.id })
		return result
	}

	async removeConversion(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(uomConversions)
			.where(eq(uomConversions.id, id))
			.returning({ id: uomConversions.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: UomFilterDto) {
		return allOf(
			searchAcross(filter.q, [uoms.code, uoms.name]),
			eqIf(uoms.category, filter.category),
		)
	}
}

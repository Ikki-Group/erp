import { desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm'

import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { DbContext } from './client.ts'
import { buildPaginationMeta, toLimitOffset } from './index.ts'
import type { SQL } from 'drizzle-orm'
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core'

// ─── Types ───

type IdTable = PgTable & { id: AnyPgColumn }
type SoftDeleteTable = IdTable & { isActive: AnyPgColumn }

type RowOf<TTable extends IdTable> = TTable['$inferSelect']
type InsertOf<TTable extends IdTable> = TTable['$inferInsert']
type UpdateOf<TTable extends IdTable> = Partial<Omit<InsertOf<TTable>, 'id'>>

interface PageQuery {
	where?: SQL | undefined
	/** Defaults to `id desc`. */
	orderBy?: SQL | SQL[]
}

/**
 * Standard repo contract shared by simple slices (AGENTS.md: finders → DTO | undefined, writes →
 * EntityRef | undefined). Members are `this`-free functions, so they can be re-exposed directly
 * (e.g. `findPricingById: pricing.findById`).
 */
interface CrudRepoBase<TDto, TInsert> {
	findById: (id: number, db?: DbContext) => Promise<TDto | undefined>
	findByIds: (ids: number[], db?: DbContext) => Promise<TDto[]>
	findMany: (db?: DbContext) => Promise<TDto[]>
	insert: (data: TInsert, db?: DbContext) => Promise<EntityRef | undefined>
	update: (
		id: number,
		data: Partial<Omit<TInsert, 'id'>>,
		db?: DbContext,
	) => Promise<EntityRef | undefined>
}

/** CRUD repo whose `remove` hard-deletes the row. */
export interface CrudRepo<TDto, TInsert> extends CrudRepoBase<TDto, TInsert> {
	remove: (id: number, db?: DbContext) => Promise<EntityRef | undefined>
}

/** CRUD repo whose `remove` flips `isActive` to false while applying the given stamp. */
export interface SoftDeleteCrudRepo<TDto, TInsert> extends CrudRepoBase<TDto, TInsert> {
	remove: (
		id: number,
		data: Partial<Omit<TInsert, 'id'>>,
		db?: DbContext,
	) => Promise<EntityRef | undefined>
}

/** Window-count paginated select over the whole table row; slices supply only filter + order. */
interface Paginator<TDto> {
	paginate(
		filter: PaginationQuery,
		query: PageQuery,
		db?: DbContext,
	): Promise<WithPaginationResult<TDto>>
}

interface CrudRepoOptions<TTable extends IdTable, TDto> {
	db: DbContext
	table: TTable
	toDto: (row: RowOf<TTable>) => TDto
}

// ─── Factory ───

export function createCrudRepo<TTable extends SoftDeleteTable, TDto>(
	options: CrudRepoOptions<TTable, TDto> & { softDelete: true },
): SoftDeleteCrudRepo<TDto, InsertOf<TTable>> & Paginator<TDto>
export function createCrudRepo<TTable extends IdTable, TDto>(
	options: CrudRepoOptions<TTable, TDto> & { softDelete?: false },
): CrudRepo<TDto, InsertOf<TTable>> & Paginator<TDto>
export function createCrudRepo<TTable extends IdTable, TDto>(
	options: CrudRepoOptions<TTable, TDto> & { softDelete?: boolean },
): CrudRepoBase<TDto, InsertOf<TTable>> &
	Paginator<TDto> & { remove: (...args: never[]) => Promise<EntityRef | undefined> } {
	const { db: baseDb, table, toDto, softDelete = false } = options
	// Drizzle cannot resolve row/value types for a generic table, so queries run against the
	// erased `PgTable` and the typed boundary is re-established by the overload signatures:
	// rows are the table's select model, writes take its insert model.
	const erased: PgTable = table
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- rows come from `erased`, i.e. `table`
	const toDtos = (rows: unknown[]) => (rows as RowOf<TTable>[]).map((row) => toDto(row))
	const returningId = { id: table.id }
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- returning({ id }) on an integer pk
	const firstRef = (rows: unknown[]) => rows[0] as EntityRef | undefined

	async function updateRow(id: number, data: UpdateOf<TTable>, db: DbContext) {
		const rows = await db.update(erased).set(data).where(eq(table.id, id)).returning(returningId)
		return firstRef(rows)
	}

	return {
		async findById(id, db = baseDb) {
			const rows = await db.select().from(erased).where(eq(table.id, id)).limit(1)
			return toDtos(rows)[0]
		},

		async findByIds(ids, db = baseDb) {
			if (ids.length === 0) return []
			return toDtos(await db.select().from(erased).where(inArray(table.id, ids)))
		},

		async findMany(db = baseDb) {
			return toDtos(await db.select().from(erased))
		},

		async insert(data, db = baseDb) {
			return firstRef(await db.insert(erased).values(data).returning(returningId))
		},

		async update(id, data, db = baseDb) {
			return updateRow(id, data, db)
		},

		remove: softDelete
			? async (id: number, data: UpdateOf<TTable>, db: DbContext = baseDb) =>
					updateRow(id, { ...data, isActive: false }, db)
			: async (id: number, db: DbContext = baseDb) =>
					firstRef(await db.delete(erased).where(eq(table.id, id)).returning(returningId)),

		async paginate(filter, query, db = baseDb) {
			const { limit, offset } = toLimitOffset(filter)
			const orderBy = query.orderBy ?? desc(table.id)
			const rows = await db
				.select({
					...getTableColumns(erased),
					rowCount: sql<number>`count(*) over()`.as('row_count'),
				})
				.from(erased)
				.where(query.where)
				.orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
				.limit(limit)
				.offset(offset)
			const total = rows[0]?.rowCount ?? 0
			return {
				data: toDtos(rows.map(({ rowCount: _, ...row }) => row)),
				meta: buildPaginationMeta(filter.page, filter.limit, total),
			}
		},
	}
}

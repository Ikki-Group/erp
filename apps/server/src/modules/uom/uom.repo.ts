import { and, count, eq, SQL } from 'drizzle-orm'

import { uomsTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { UomDto, UomFilterDto } from './uom.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type UomInsert = typeof uomsTable.$inferInsert
type UomUpdate = PgUpdateSetSource<typeof uomsTable>

/**
 * Repository port for the UOM module. Services depend on this interface
 * (not the concrete class) so they can be unit-tested with plain in-memory
 * fakes and no database. Not-found reads return `undefined`; writes return the
 * affected `EntityRef` or `undefined`. Repos never throw for "not found" — the
 * service decides error semantics. Every write accepts an optional `db`
 * override so it can participate in a caller's transaction.
 */
export interface IUomRepo {
	readonly db: DbContext
	findMany(filter?: Partial<Pick<UomFilterDto, 'q'>>, db?: DbContext): Promise<UomDto[]>
	findPage(filter: UomFilterDto, db?: DbContext): Promise<WithPaginationResult<UomDto>>
	findById(id: number, db?: DbContext): Promise<UomDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: UomInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: UomInsert[], db?: DbContext): Promise<void>
	update(id: number, data: UomUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class UomRepo implements IUomRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<UomFilterDto, 'q'>>): SQL | undefined {
		const { q } = filter
		return and(q === undefined ? undefined : searchFilter(uomsTable.code, q))
	}

	async findMany(
		filter: Partial<Pick<UomFilterDto, 'q'>> = {},
		db: DbContext = this.db,
	): Promise<UomDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(uomsTable).where(where).orderBy(uomsTable.code)
	}

	async findPage(filter: UomFilterDto, db: DbContext = this.db): Promise<WithPaginationResult<UomDto>> {
		const where = this.#buildWhere(filter)

		return paginate<UomDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(uomsTable)
					.where(where)
					.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(uomsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<UomDto | undefined> {
		return db.select().from(uomsTable).where(eq(uomsTable.id, id)).limit(1).then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(uomsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: UomInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(uomsTable).values({ ...data }).returning({ id: uomsTable.id })

		return res
	}

	async insertMany(items: UomInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(uomsTable).values(items).onConflictDoNothing()
	}

	async update(id: number, data: UomUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(uomsTable)
			.set({ ...data })
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(uomsTable)
			.where(eq(uomsTable.id, id))
			.returning({ id: uomsTable.id })
		return res
	}
}

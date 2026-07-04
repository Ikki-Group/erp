import { count, eq, or, SQL } from 'drizzle-orm'

import { salesTypesTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { SalesTypeDto, SalesTypeFilterDto } from './sales-type.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type SalesTypeInsert = typeof salesTypesTable.$inferInsert
type SalesTypeUpdate = PgUpdateSetSource<typeof salesTypesTable>

/**
 * Repository port for the sales-type module. Services depend on this interface
 * (not the concrete class) so they can be unit-tested with plain in-memory
 * fakes and no database. Not-found reads return `undefined`; writes return the
 * affected `EntityRef` or `undefined`. Repos never throw for "not found" — the
 * service decides error semantics. Every write accepts an optional `db`
 * override so it can participate in a caller's transaction.
 */
export interface ISalesTypeRepo {
	/** The default database context this repo is bound to (client or tx). */
	readonly db: DbContext
	findMany(filter?: SalesTypeFilterDto, db?: DbContext): Promise<SalesTypeDto[]>
	findPage(filter: SalesTypeFilterDto, db?: DbContext): Promise<WithPaginationResult<SalesTypeDto>>
	findById(id: number, db?: DbContext): Promise<SalesTypeDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<SalesTypeDto[]>
	count(db?: DbContext): Promise<number>
	insert(data: SalesTypeInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: SalesTypeInsert[], db?: DbContext): Promise<void>
	update(id: number, data: SalesTypeUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class SalesTypeRepo implements ISalesTypeRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<SalesTypeFilterDto, 'q'>>): SQL | undefined {
		const { q } = filter
		return q === undefined
			? undefined
			: or(searchFilter(salesTypesTable.name, q), searchFilter(salesTypesTable.code, q))
	}

	async findMany(
		filter: Partial<Pick<SalesTypeFilterDto, 'q'>> = {},
		db: DbContext = this.db,
	): Promise<SalesTypeDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(salesTypesTable).where(where)
	}

	async findPage(
		filter: SalesTypeFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<SalesTypeDto>> {
		const where = this.#buildWhere(filter)

		return paginate<SalesTypeDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(salesTypesTable)
					.where(where)
					.orderBy(sortBy(salesTypesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(salesTypesTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<SalesTypeDto | undefined> {
		return db
			.select()
			.from(salesTypesTable)
			.where(eq(salesTypesTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<SalesTypeDto[]> {
		if (ids.length === 0) return []
		const { inArray } = await import('drizzle-orm')
		return db.select().from(salesTypesTable).where(inArray(salesTypesTable.id, ids))
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(salesTypesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: SalesTypeInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(salesTypesTable)
			.values({ ...data })
			.returning({ id: salesTypesTable.id })

		return res
	}

	async insertMany(items: SalesTypeInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(salesTypesTable).values(items).onConflictDoNothing()
	}

	async update(
		id: number,
		data: SalesTypeUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(salesTypesTable)
			.set({ ...data })
			.where(eq(salesTypesTable.id, id))
			.returning({ id: salesTypesTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(salesTypesTable)
			.where(eq(salesTypesTable.id, id))
			.returning({ id: salesTypesTable.id })
		return res
	}

	/* -------------------------------- SEED -------------------------------- */

	async seed(
		data: (SalesTypeInsert & { id?: number; createdBy: ActorId })[],
		db: DbContext = this.db,
	): Promise<void> {
		for (const d of data) {
			const { isSystem, ...rest } = d
			await db.insert(salesTypesTable).values({ ...rest, isSystem }).onConflictDoNothing()
		}
	}
}

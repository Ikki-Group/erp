import { and, count, eq, isNull, or, SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { suppliersTable } from '@/db/schema/supplier'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { SupplierDto, SupplierFilterDto } from './supplier.contract'

type SupplierInsert = typeof suppliersTable.$inferInsert
type SupplierUpdate = PgUpdateSetSource<typeof suppliersTable>

export interface ISupplierRepo {
	readonly db: DbContext
	findMany(filter?: SupplierFilterDto, db?: DbContext): Promise<SupplierDto[]>
	findPage(filter: SupplierFilterDto, db?: DbContext): Promise<WithPaginationResult<SupplierDto>>
	findById(id: number, db?: DbContext): Promise<SupplierDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<SupplierDto[]>
	insert(data: SupplierInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: SupplierInsert[], db?: DbContext): Promise<void>
	update(id: number, data: SupplierUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class SupplierRepo implements ISupplierRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<SupplierFilterDto, 'q'>>): SQL | undefined {
		const { q } = filter
		return and(
			isNull(suppliersTable.deletedAt),
			q === undefined
				? undefined
				: or(searchFilter(suppliersTable.name, q), searchFilter(suppliersTable.code, q)),
		)
	}

	async findMany(
		filter: Partial<Pick<SupplierFilterDto, 'q'>> = {},
		db: DbContext = this.db,
	): Promise<SupplierDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(suppliersTable).where(where)
	}

	async findPage(
		filter: SupplierFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<SupplierDto>> {
		const where = this.#buildWhere(filter)

		return paginate<SupplierDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(suppliersTable)
					.where(where)
					.orderBy(sortBy(suppliersTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(suppliersTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<SupplierDto | undefined> {
		return db
			.select()
			.from(suppliersTable)
			.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<SupplierDto[]> {
		if (ids.length === 0) return []
		const { inArray } = await import('drizzle-orm')
		return db
			.select()
			.from(suppliersTable)
			.where(and(inArray(suppliersTable.id, ids), isNull(suppliersTable.deletedAt)))
	}

	async insert(data: SupplierInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(suppliersTable)
			.values({ ...data })
			.returning({ id: suppliersTable.id })

		return res
	}

	async insertMany(items: SupplierInsert[], db: DbContext = this.db): Promise<void> {
		if (items.length === 0) return
		await db.insert(suppliersTable).values(items).onConflictDoNothing()
	}

	async update(
		id: number,
		data: SupplierUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(suppliersTable)
			.set({ ...data })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(suppliersTable)
			.set({ deletedAt: new Date() })
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id })
		return res
	}
}

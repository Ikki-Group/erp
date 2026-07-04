import { and, count, eq, ilike, isNull, or, type SQL } from 'drizzle-orm'

import { accountsTable } from '@/db/schema/finance'
import { paginate, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { AccountDto, AccountFilterDto } from './account.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type AccountInsert = typeof accountsTable.$inferInsert
type AccountUpdate = PgUpdateSetSource<typeof accountsTable>

export interface IAccountRepo {
	readonly db: DbContext
	findMany(filter?: Partial<AccountFilterDto>, db?: DbContext): Promise<AccountDto[]>
	findPage(filter: AccountFilterDto, db?: DbContext): Promise<WithPaginationResult<AccountDto>>
	findById(id: number, db?: DbContext): Promise<AccountDto | undefined>
	findByCode(code: string, db?: DbContext): Promise<AccountDto | undefined>
	hasChildren(id: number, db?: DbContext): Promise<boolean>
	insert(data: AccountInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: AccountUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class AccountRepo implements IAccountRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter?: Partial<Pick<AccountFilterDto, 'q' | 'type' | 'parentId'>>): SQL | undefined {
		if (!filter) return isNull(accountsTable.deletedAt)
		const { q, type, parentId } = filter
		return and(
			q
				? or(ilike(accountsTable.name, `%${q}%`), ilike(accountsTable.code, `%${q}%`))
				: undefined,
			isNull(accountsTable.deletedAt),
			type ? eq(accountsTable.type, type) : undefined,
			parentId !== undefined ? eq(accountsTable.parentId, parentId) : undefined,
		)
	}

	async findMany(
		filter?: Partial<AccountFilterDto>,
		db: DbContext = this.db,
	): Promise<AccountDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(accountsTable).where(where)
	}

	async findPage(
		filter: AccountFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<AccountDto>> {
		const where = this.#buildWhere(filter)

		return paginate<AccountDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(accountsTable)
					.where(where)
					.orderBy(sortBy(accountsTable.code, 'asc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(accountsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<AccountDto | undefined> {
		return db
			.select()
			.from(accountsTable)
			.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async findByCode(code: string, db: DbContext = this.db): Promise<AccountDto | undefined> {
		return db
			.select()
			.from(accountsTable)
			.where(and(eq(accountsTable.code, code), isNull(accountsTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async hasChildren(id: number, db: DbContext = this.db): Promise<boolean> {
		const [child] = await db
			.select({ id: accountsTable.id })
			.from(accountsTable)
			.where(and(eq(accountsTable.parentId, id), isNull(accountsTable.deletedAt)))
			.limit(1)
		return !!child
	}

	async insert(data: AccountInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(accountsTable)
			.values({ ...data })
			.returning({ id: accountsTable.id })
		return res
	}

	async update(id: number, data: AccountUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(accountsTable)
			.set({ ...data })
			.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))
			.returning({ id: accountsTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(accountsTable)
			.set({ deletedAt: new Date() })
			.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))
			.returning({ id: accountsTable.id })
		return res
	}
}

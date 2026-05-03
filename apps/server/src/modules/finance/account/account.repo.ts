import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { paginate, sortBy, stampCreate, stampUpdate, type DbClient } from '@/core/database'

import { accountsTable } from '@/db/schema/finance'

import type { AccountCreateDto, AccountFilterDto, AccountUpdateDto } from './account.dto'

export class AccountRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number) {
		return record('AccountRepo.getById', async () => {
			const [account] = await this.db
				.select()
				.from(accountsTable)
				.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))

			return account ?? null
		})
	}

	async getListPaginated(query: AccountFilterDto) {
		return record('AccountRepo.getListPaginated', async () => {
			const { q, type, parentId, limit, page } = query

			const where = and(
				q
					? or(ilike(accountsTable.name, `%${q}%`), ilike(accountsTable.code, `%${q}%`))
					: undefined,
				isNull(accountsTable.deletedAt),
				type ? eq(accountsTable.type, type) : undefined,
				parentId !== undefined ? eq(accountsTable.parentId, parentId) : undefined,
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					return this.db
						.select()
						.from(accountsTable)
						.where(where)
						.limit(l)
						.offset(offset)
						.orderBy(sortBy(accountsTable.code, 'asc'))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(accountsTable).where(where),
			})
		})
	}

	async findByCode(code: string) {
		return record('AccountRepo.findByCode', async () => {
			const [result] = await this.db
				.select()
				.from(accountsTable)
				.where(and(eq(accountsTable.code, code), isNull(accountsTable.deletedAt)))
				.limit(1)

			return result ?? null
		})
	}

	async hasChildren(id: number): Promise<boolean> {
		const [child] = await this.db
			.select({ id: accountsTable.id })
			.from(accountsTable)
			.where(and(eq(accountsTable.parentId, id), isNull(accountsTable.deletedAt)))
			.limit(1)
		return !!child
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: AccountCreateDto, actorId: number) {
		return record('AccountRepo.create', async () => {
			const stamps = stampCreate(actorId)
			const [result] = await this.db
				.insert(accountsTable)
				.values({ ...data, ...stamps })
				.returning({ id: accountsTable.id })

			if (!result) throw new Error('Failed to create account')
			return result
		})
	}

	async update(id: number, data: AccountUpdateDto, actorId: number) {
		return record('AccountRepo.update', async () => {
			const stamps = stampUpdate(actorId)
			const [result] = await this.db
				.update(accountsTable)
				.set({ ...data, ...stamps })
				.where(eq(accountsTable.id, id))
				.returning({ id: accountsTable.id })

			if (!result) throw new Error('Failed to update account')
			return result
		})
	}

	async softDelete(id: number, actorId: number) {
		return record('AccountRepo.softDelete', async () => {
			const [result] = await this.db
				.update(accountsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(accountsTable.id, id))
				.returning({ id: accountsTable.id })

			if (!result) throw new Error('Failed to delete account')
			return result
		})
	}
}

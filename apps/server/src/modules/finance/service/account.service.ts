import { record } from '@elysiajs/opentelemetry'
import { count, ilike, or, and, eq, isNull } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirstOrThrow, paginate, sortBy } from '@/core/database'

import { db } from '@/db'
import { accountsTable } from '@/db/schema/finance'

import type { AccountCreateDto, AccountUpdateDto, AccountFilterDto } from '../dto/account.dto'

export class AccountService {
	async handleList(query: AccountFilterDto) {
		return record('AccountService.handleList', async () => {
			const { search, type, parentId, limit = 50, page = 1 } = query

			const where = and(
				search
					? or(ilike(accountsTable.name, `%${search}%`), ilike(accountsTable.code, `%${search}%`))
					: undefined,
				isNull(accountsTable.deletedAt),
				type ? eq(accountsTable.type, type) : undefined,
				parentId !== undefined ? eq(accountsTable.parentId, parentId) : undefined,
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					return db
						.select()
						.from(accountsTable)
						.where(where)
						.limit(l)
						.offset(offset)
						.orderBy(sortBy(accountsTable.code, 'asc'))
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(accountsTable).where(where),
			})
		})
	}

	async handleDetail(id: number) {
		return record('AccountService.handleDetail', async () => {
			const result = await db
				.select()
				.from(accountsTable)
				.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))

			return takeFirstOrThrow(result, `Account ${id} not found`, 'ACCOUNT_NOT_FOUND')
		})
	}

	async handleCreate(data: AccountCreateDto, actorId: number) {
		return record('AccountService.handleCreate', async () => {
			const stamps = stampCreate(actorId)
			const rows = await db
				.insert(accountsTable)
				.values({ ...data, ...stamps })
				.returning({ id: accountsTable.id })

			return takeFirstOrThrow(rows, 'Failed to create account', 'ACCOUNT_CREATE_FAILED')
		})
	}

	async handleUpdate(id: number, data: AccountUpdateDto, actorId: number) {
		return record('AccountService.handleUpdate', async () => {
			const stamps = stampUpdate(actorId)
			const rows = await db
				.update(accountsTable)
				.set({ ...data, ...stamps })
				.where(eq(accountsTable.id, id))
				.returning({ id: accountsTable.id })

			return takeFirstOrThrow(rows, 'Failed to update account', 'ACCOUNT_UPDATE_FAILED')
		})
	}

	async handleRemove(id: number, actorId: number) {
		return record('AccountService.handleRemove', async () => {
			const children = await db
				.select({ id: accountsTable.id })
				.from(accountsTable)
				.where(and(eq(accountsTable.parentId, id), isNull(accountsTable.deletedAt)))
				.limit(1)
			if (children.length > 0) {
				throw new Error('Account has children, cannot delete')
			}

			const stamps = stampUpdate(actorId)
			const rows = await db
				.update(accountsTable)
				.set({ deletedAt: stamps.updatedAt, deletedBy: actorId })
				.where(eq(accountsTable.id, id))
				.returning({ id: accountsTable.id })

			return takeFirstOrThrow(rows, `Account ${id} not found on remove`, 'ACCOUNT_NOT_FOUND')
		})
	}

	async findByCode(code: string) {
		const [result] = await db
			.select()
			.from(accountsTable)
			.where(and(eq(accountsTable.code, code), isNull(accountsTable.deletedAt)))
			.limit(1)

		return result ?? null
	}
}

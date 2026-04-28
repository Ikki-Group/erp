import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { paginate, sortBy, stampCreate, stampUpdate, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { accountsTable } from '@/db/schema/finance'

import type { AccountCreateDto, AccountFilterDto, AccountUpdateDto } from './account.dto'

const ACCOUNT_CACHE_NAMESPACE = 'finance.account'

export class AccountRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(ACCOUNT_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'AccountRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number) {
		return record('AccountRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [account] = await this.db
						.select()
						.from(accountsTable)
						.where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))

					if (!account) return skip()
					return account
				},
			})
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
			return this.cache.getOrSet({
				key: `code.${code}`,
				factory: async () => {
					const [result] = await this.db
						.select()
						.from(accountsTable)
						.where(and(eq(accountsTable.code, code), isNull(accountsTable.deletedAt)))
						.limit(1)

					return result ?? null
				},
			})
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
			this.#clearCacheAsync()
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
			void this.#clearCache(id)
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
			void this.#clearCache(id)
			return result
		})
	}
}

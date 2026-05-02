import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gt, isNull, lt } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	sortBy,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'
import { logger } from '@/core/logger'

import { sessionsTable, usersTable } from '@/db/schema'

import { SessionDto, SessionFilterDto, SessionSelectDto } from './session.dto'

const SESSION_CACHE_NAMESPACE = 'iam.session'

export class SessionRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(SESSION_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'SessionRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SessionDto | undefined> {
		return record('SessionRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [session] = await this.db
						.select()
						.from(sessionsTable)
						.where(eq(sessionsTable.id, id))

					if (!session) return skip()

					return SessionDto.parse(session)
				},
			})
		})
	}

	async getListPaginated(filter: SessionFilterDto): Promise<WithPaginationResult<SessionSelectDto>> {
		return record('SessionRepo.getListPaginated', async () => {
			const { page, limit, userId, isActive } = filter
			const now = new Date()

			const where = and(
				userId === undefined ? undefined : eq(sessionsTable.userId, userId),
				isActive === undefined ? undefined : (isActive ? gt(sessionsTable.expiredAt, now) : lt(sessionsTable.expiredAt, now)),
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select({
							...sessionsTable,
							userEmail: usersTable.email,
							userUsername: usersTable.username,
							userFullname: usersTable.fullname,
						})
						.from(sessionsTable)
						.leftJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
						.where(where)
						.orderBy(sortBy(sessionsTable.createdAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => SessionSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(sessionsTable).where(where),
			})
		})
	}

	async getByUserId(userId: number): Promise<SessionDto[]> {
		return record('SessionRepo.getByUserId', async () => {
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(eq(sessionsTable.userId, userId))
				.orderBy(sortBy(sessionsTable.createdAt, 'desc'))
			return sessions.map((s) => SessionDto.parse(s))
		})
	}

	async getActiveByUserId(userId: number): Promise<SessionDto[]> {
		return record('SessionRepo.getActiveByUserId', async () => {
			const now = new Date()
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(and(eq(sessionsTable.userId, userId), gt(sessionsTable.expiredAt, now)))
				.orderBy(sortBy(sessionsTable.createdAt, 'desc'))
			return sessions.map((s) => SessionDto.parse(s))
		})
	}

	async getExpired(): Promise<SessionDto[]> {
		return record('SessionRepo.getExpired', async () => {
			const now = new Date()
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(lt(sessionsTable.expiredAt, now))
				.orderBy(sortBy(sessionsTable.expiredAt, 'asc'))
			return sessions.map((s) => SessionDto.parse(s))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(userId: number, expiredAt: Date): Promise<{ id: number }> {
		return record('SessionRepo.create', async () => {
			const [result] = await this.db
				.insert(sessionsTable)
				.values({
					userId,
					expiredAt,
					createdAt: new Date(),
				})
				.returning({ id: sessionsTable.id })

			if (!result) throw new Error('Session creation failed')

			this.#clearCacheAsync()
			return result
		})
	}

	async delete(id: number): Promise<{ id: number }> {
		return record('SessionRepo.delete', async () => {
			const [result] = await this.db
				.delete(sessionsTable)
				.where(eq(sessionsTable.id, id))
				.returning({ id: sessionsTable.id })

			if (!result) throw new Error('Session not found')

			this.#clearCacheAsync(id)
			return result
		})
	}

	async deleteMany(ids: number[]): Promise<number> {
		return record('SessionRepo.deleteMany', async () => {
			const result = await this.db
				.delete(sessionsTable)
				.where(
					// @ts-ignore - drizzle doesn't support array in where directly, but this works
					sessionsTable.id.in(ids),
				)

			this.#clearCacheAsync()
			return result.rowCount ?? 0
		})
	}

	async deleteByUserId(userId: number): Promise<number> {
		return record('SessionRepo.deleteByUserId', async () => {
			const result = await this.db
				.delete(sessionsTable)
				.where(eq(sessionsTable.userId, userId))

			this.#clearCacheAsync()
			return result.rowCount ?? 0
		})
	}

	async deleteByUserIdExcept(userId: number, exceptSessionId: number): Promise<number> {
		return record('SessionRepo.deleteByUserIdExcept', async () => {
			const result = await this.db
				.delete(sessionsTable)
				.where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.id, exceptSessionId).not()))

			this.#clearCacheAsync()
			return result.rowCount ?? 0
		})
	}

	async deleteExpired(): Promise<number> {
		return record('SessionRepo.deleteExpired', async () => {
			const now = new Date()
			const result = await this.db
				.delete(sessionsTable)
				.where(lt(sessionsTable.expiredAt, now))

			this.#clearCacheAsync()
			return result.rowCount ?? 0
		})
	}

	async refreshExpiry(id: number, newExpiredAt: Date): Promise<{ id: number }> {
		return record('SessionRepo.refreshExpiry', async () => {
			const [result] = await this.db
				.update(sessionsTable)
				.set({ expiredAt: newExpiredAt })
				.where(eq(sessionsTable.id, id))
				.returning({ id: sessionsTable.id })

			if (!result) throw new Error('Session not found')

			this.#clearCacheAsync(id)
			return result
		})
	}
}

import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gt, lt, not } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { paginate, sortBy, type DbClient, type WithPaginationResult } from '@/core/database'
import { logger } from '@/core/logger'

import { sessionsTable, usersTable } from '@/db/schema'

import * as dto from './session.dto'

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

	async getById(id: number): Promise<dto.SessionDto | undefined> {
		return record('SessionRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [session] = await this.db
						.select()
						.from(sessionsTable)
						.where(eq(sessionsTable.id, id))

					if (!session) return skip()

					return dto.SessionDto.parse(session)
				},
			})
		})
	}

	async getListPaginated(
		filter: dto.SessionFilterDto,
	): Promise<WithPaginationResult<dto.SessionSelectDto>> {
		return record('SessionRepo.getListPaginated', async () => {
			const { page, limit, userId, isActive } = filter
			const now = new Date()

			const where = and(
				userId === undefined ? undefined : eq(sessionsTable.userId, userId),
				isActive === undefined
					? undefined
					: isActive
						? gt(sessionsTable.expiredAt, now)
						: lt(sessionsTable.expiredAt, now),
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select({
							id: sessionsTable.id,
							userId: sessionsTable.userId,
							expiredAt: sessionsTable.expiredAt,
							createdAt: sessionsTable.createdAt,
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
					return rows.map((r) => dto.SessionSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(sessionsTable).where(where),
			})
		})
	}

	async getByUserId(userId: number): Promise<dto.SessionDto[]> {
		return record('SessionRepo.getByUserId', async () => {
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(eq(sessionsTable.userId, userId))
				.orderBy(sortBy(sessionsTable.createdAt, 'desc'))
			return sessions.map((s) => dto.SessionDto.parse(s))
		})
	}

	async getActiveByUserId(userId: number): Promise<dto.SessionDto[]> {
		return record('SessionRepo.getActiveByUserId', async () => {
			const now = new Date()
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(and(eq(sessionsTable.userId, userId), gt(sessionsTable.expiredAt, now)))
				.orderBy(sortBy(sessionsTable.createdAt, 'desc'))
			return sessions.map((s) => dto.SessionDto.parse(s))
		})
	}

	async getExpired(): Promise<dto.SessionDto[]> {
		return record('SessionRepo.getExpired', async () => {
			const now = new Date()
			const sessions = await this.db
				.select()
				.from(sessionsTable)
				.where(lt(sessionsTable.expiredAt, now))
				.orderBy(sortBy(sessionsTable.expiredAt, 'asc'))
			return sessions.map((s) => dto.SessionDto.parse(s))
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

	async deleteMany(ids: number[]): Promise<void> {
		return record('SessionRepo.deleteMany', async () => {
			await this.db.delete(sessionsTable).where(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
				// @ts-expect-error - drizzle doesn't support array in where directly, but this works
				sessionsTable.id.in(ids),
			)

			this.#clearCacheAsync()
		})
	}

	async deleteByUserId(userId: number): Promise<void> {
		return record('SessionRepo.deleteByUserId', async () => {
			await this.db.delete(sessionsTable).where(eq(sessionsTable.userId, userId))

			this.#clearCacheAsync()
		})
	}

	async deleteByUserIdExcept(userId: number, exceptSessionId: number): Promise<void> {
		return record('SessionRepo.deleteByUserIdExcept', async () => {
			await this.db
				.delete(sessionsTable)
				.where(and(eq(sessionsTable.userId, userId), not(eq(sessionsTable.id, exceptSessionId))))

			this.#clearCacheAsync()
		})
	}

	async deleteExpired(): Promise<void> {
		return record('SessionRepo.deleteExpired', async () => {
			const now = new Date()
			await this.db.delete(sessionsTable).where(lt(sessionsTable.expiredAt, now))

			this.#clearCacheAsync()
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

import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, or } from 'drizzle-orm'
import { omit } from 'es-toolkit'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { userAssignmentsTable, usersTable } from '@/db/schema'

import * as dto from './user.dto'

const USER_CACHE_NAMESPACE = 'iam:user'

export class UserRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(USER_CACHE_NAMESPACE)
	}

	#clearCache(id?: number): Promise<void> {
		return record('UserRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'UserRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: dto.UserFilterDto): Promise<WithPaginationResult<dto.UserDto>> {
		return record('UserRepo.getListPaginated', async () => {
			const { q, page, limit, isActive, isRoot } = filter
			const where = and(
				q === undefined
					? undefined
					: or(
							searchFilter(usersTable.fullname, q),
							searchFilter(usersTable.username, q),
							searchFilter(usersTable.email, q),
						),
				isActive === undefined ? undefined : eq(usersTable.isActive, isActive),
				isRoot === undefined ? undefined : eq(usersTable.isRoot, isRoot),
				filter.locationId === undefined
					? undefined
					: exists(
							this.db
								.select()
								.from(userAssignmentsTable)
								.where(
									and(
										eq(userAssignmentsTable.userId, usersTable.id),
										eq(userAssignmentsTable.locationId, filter.locationId),
									),
								),
						),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(usersTable)
						.where(where)
						.orderBy(sortBy(usersTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(usersTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.UserDto[]> {
		return record('UserRepo.getList', async () =>
			this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.db.select().from(usersTable).orderBy(usersTable.id),
			}),
		)
	}

	async getById(id: number): Promise<dto.UserDto | undefined> {
		return record('UserRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(usersTable)
						.where(eq(usersTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(dto.UserDto & { passwordHash: string }) | null> {
		return record('UserRepo.findByIdentifier', async () => {
			const user = await this.db
				.select()
				.from(usersTable)
				.where(or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)))
				.limit(1)
				.then(takeFirst)

			if (!user) return null
			return user
		})
	}

	async getPasswordHash(id: number): Promise<string | null> {
		return record('UserRepo.getPasswordHash', async () => {
			const res = await this.db
				.select({ passwordHash: usersTable.passwordHash })
				.from(usersTable)
				.where(eq(usersTable.id, id))
				.limit(1)
				.then(takeFirst)
			return res?.passwordHash ?? null
		})
	}

	async count(): Promise<number> {
		return record('UserRepo.count', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return this.db
						.select({ count: count() })
						.from(usersTable)
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	) {
		return record('UserRepo.seed', async () => {
			const insertedIds: number[] = []
			// oxlint-disable-next-line no-unused-vars
			for (const { assignments, ...d } of data) {
				const metadata = stampCreate(d.createdBy)
				const [inserted] = await this.db
					.insert(usersTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: usersTable.username,
						set: {
							email: d.email,
							fullname: d.fullname,
							isActive: d.isActive,
							isRoot: d.isRoot,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
					.returning({ id: usersTable.id })

				if (inserted) insertedIds.push(inserted.id)
			}

			this.#clearCacheAsync()
			return insertedIds
		})
	}

	async create(
		data: dto.UserCreateDto & { passwordHash: string },
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.create', async () => {
			const userData = omit(data, ['assignments'])
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(usersTable)
				.values({ ...userData, ...metadata })
				.returning({ id: usersTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(
		data: dto.UserUpdateDto & { passwordHash?: string },
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.update', async () => {
			const userData = omit(data, ['assignments'])
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(usersTable)
				.set({ ...userData, ...metadata })
				.where(eq(usersTable.id, data.id))
				.returning({ id: usersTable.id })

			this.#clearCacheAsync(data.id)
			return res?.id
		})
	}

	async updatePassword(
		id: number,
		passwordHash: string,
		actorId: number,
	): Promise<number | undefined> {
		return record('UserRepo.updatePassword', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(usersTable)
				.set({ passwordHash, ...metadata })
				.where(eq(usersTable.id, id))
				.returning({ id: usersTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('UserRepo.remove', async () => {
			const [res] = await this.db
				.delete(usersTable)
				.where(eq(usersTable.id, id))
				.returning({ id: usersTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}
}

import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { rolesTable } from '@/db/schema'

import * as dto from './role.dto'

const ROLE_CACHE_NAMESPACE = 'role'

export class RoleRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(ROLE_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('RoleRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'RoleRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: dto.RoleFilterDto): Promise<WithPaginationResult<dto.RoleDto>> {
		return record('RoleRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = q === undefined ? undefined : searchFilter(rolesTable.name, q)

			return paginate<dto.RoleDto>({
				data: ({ limit: l, offset }) => {
					const rows = this.db
						.select()
						.from(rolesTable)
						.where(where)
						.orderBy(rolesTable.name)
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(rolesTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleRepo.getList', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.db.select().from(rolesTable),
			})
		})
	}

	async getById(id: number): Promise<dto.RoleDto | undefined> {
		return record('RoleRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(rolesTable)
						.where(eq(rolesTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('RoleRepo.count', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return this.db
						.select({ count: count() })
						.from(rolesTable)
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.RoleCreateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(rolesTable)
				.values({ ...data, ...metadata })
				.returning({ id: rolesTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(data: dto.RoleUpdateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(rolesTable)
				.set({ ...data, ...metadata })
				.where(eq(rolesTable.id, data.id))
				.returning({ id: rolesTable.id })

			this.#clearCacheAsync(res?.id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('RoleRepo.remove', async () => {
			const [res] = await this.db
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			this.#clearCacheAsync(id)
			return res?.id
		})
	}

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(rolesTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: rolesTable.code,
						set: {
							name: d.name,
							description: d.description,
							permissions: d.permissions,
							isSystem: d.isSystem,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}

			this.#clearCacheAsync()
		})
	}
}

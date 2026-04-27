import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { rolesTable } from '@/db/schema'

import * as dto from './role.dto'

const cache = bento.namespace('role')

export class RoleRepo {
	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('RoleRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: dto.RoleFilterDto): Promise<WithPaginationResult<dto.RoleDto>> {
		return record('RoleRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = q === undefined ? undefined : searchFilter(rolesTable.name, q)

			return paginate<dto.RoleDto>({
				data: ({ limit: l, offset }) => {
					const rows = db
						.select()
						.from(rolesTable)
						.where(where)
						.orderBy(rolesTable.name)
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(rolesTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleRepo.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => db.select().from(rolesTable),
			})
		})
	}

	async getById(id: number): Promise<dto.RoleDto | undefined> {
		return record('RoleRepo.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async ({ skip }) => {
					const res = await db
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
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return db
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
			const [res] = await db
				.insert(rolesTable)
				.values({ ...data, ...metadata })
				.returning({ id: rolesTable.id })

			void this.#clearCache()
			return res?.id
		})
	}

	async update(data: dto.RoleUpdateDto, actorId: number): Promise<number | undefined> {
		return record('RoleRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(rolesTable)
				.set({ ...data, ...metadata })
				.where(eq(rolesTable.id, data.id))
				.returning({ id: rolesTable.id })

			void this.#clearCache(res?.id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('RoleRepo.remove', async () => {
			const [res] = await db
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.returning({ id: rolesTable.id })
			void this.#clearCache(id)
			return res?.id
		})
	}

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await db
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

			void this.#clearCache()
		})
	}
}

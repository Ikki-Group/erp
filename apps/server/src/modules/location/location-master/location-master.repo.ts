import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, or } from 'drizzle-orm'

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
import { locationsTable } from '@/db/schema'

import * as dto from './location-master.dto'

const cache = bento.namespace('location-master')

export class LocationMasterRepo {
	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('LocationMasterRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.LocationFilterDto,
	): Promise<WithPaginationResult<dto.LocationDto>> {
		return record('LocationMasterRepo.getListPaginated', async () => {
			const { q, page, limit, type } = filter
			const where = and(
				q === undefined
					? undefined
					: or(searchFilter(locationsTable.name, q), searchFilter(locationsTable.code, q)),
				type === undefined ? undefined : eq(locationsTable.type, type),
			)

			return paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(locationsTable)
						.where(where)
						.orderBy(locationsTable.name)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(locationsTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.LocationDto[]> {
		return record('LocationMasterRepo.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => db.select().from(locationsTable),
			})
		})
	}

	async getById(id: number): Promise<dto.LocationDto | undefined> {
		return record('LocationMasterRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await db
						.select()
						.from(locationsTable)
						.where(eq(locationsTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('LocationMasterRepo.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return db
						.select({ count: count() })
						.from(locationsTable)
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.LocationCreateDto, actorId: number): Promise<number | undefined> {
		return record('LocationMasterRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await db
				.insert(locationsTable)
				.values({ ...data, ...metadata })
				.returning({ id: locationsTable.id })

			void this.#clearCache()
			return res?.id
		})
	}

	async update(data: dto.LocationUpdateDto, actorId: number): Promise<number | undefined> {
		return record('LocationMasterRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(locationsTable)
				.set({ ...data, ...metadata })
				.where(eq(locationsTable.id, data.id))
				.returning({ id: locationsTable.id })

			void this.#clearCache(data.id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('LocationMasterRepo.remove', async () => {
			const [res] = await db
				.delete(locationsTable)
				.where(eq(locationsTable.id, id))
				.returning({ id: locationsTable.id })

			void this.#clearCache(id)
			return res?.id
		})
	}

	async seed(data: (dto.LocationCreateDto & { createdBy: number })[]) {
		return record('LocationMasterRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await db
					.insert(locationsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: locationsTable.code,
						set: {
							name: d.name,
							type: d.type,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})

				void this.#clearCache()
			}
		})
	}
}

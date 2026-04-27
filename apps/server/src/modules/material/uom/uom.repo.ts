import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { uomsTable } from '@/db/schema'

import type { UomDto, UomFilterDto } from './uom.dto'

const cache = bento.namespace('uom')

export class UomRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		return record('UomRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<UomDto[]> {
		return record('UomRepo.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					return db
						.select()
						.from(uomsTable)
						.where(isNull(uomsTable.deletedAt))
						.orderBy(uomsTable.code)
				},
			})
		})
	}

	async getListPaginated(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return record('UomRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = and(isNull(uomsTable.deletedAt), searchFilter(uomsTable.code, q))

			return paginate<UomDto>({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(uomsTable)
						.where(where)
						.orderBy(sortBy(uomsTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(uomsTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return record('UomRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await db
						.select()
						.from(uomsTable)
						.where(and(eq(uomsTable.id, id), isNull(uomsTable.deletedAt)))
						.then(takeFirst)
					return res ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('UomRepo.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return db
						.select({ count: count() })
						.from(uomsTable)
						.where(isNull(uomsTable.deletedAt))
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: { code: string } & { createdBy: number }): Promise<number | undefined> {
		return record('UomRepo.create', async () => {
			const metadata = stampCreate(data.createdBy)
			const [res] = await db
				.insert(uomsTable)
				.values({ ...data, ...metadata })
				.returning({ id: uomsTable.id })

			void this.#clearCache()
			return res?.id
		})
	}

	async update(
		id: number,
		data: { code: string } & { updatedBy: number },
	): Promise<number | undefined> {
		return record('UomRepo.update', async () => {
			const metadata = stampUpdate(data.updatedBy)
			const [res] = await db
				.update(uomsTable)
				.set({ ...data, ...metadata })
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			void this.#clearCache(res?.id)
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('UomRepo.remove', async () => {
			const [res] = await db
				.update(uomsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			void this.#clearCache(id)
			return res?.id
		})
	}

	async hardRemove(id: number): Promise<number | undefined> {
		return record('UomRepo.hardRemove', async () => {
			const [res] = await db
				.delete(uomsTable)
				.where(eq(uomsTable.id, id))
				.returning({ id: uomsTable.id })

			void this.#clearCache(id)
			return res?.id
		})
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		return record('UomRepo.seed', async () => {
			const existing = await db
				.select({ code: uomsTable.code })
				.from(uomsTable)
				.where(isNull(uomsTable.deletedAt))
			const existingCodes = new Set(existing.map((e) => e.code))

			const newUoms = data
				.map((d) => ({ ...d, code: d.code.toUpperCase().trim() }))
				.filter((d) => !existingCodes.has(d.code))

			if (newUoms.length === 0) return

			await db
				.insert(uomsTable)
				.values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))

			void this.#clearCache()
		})
	}
}

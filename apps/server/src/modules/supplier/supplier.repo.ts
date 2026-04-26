import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import { suppliersTable } from '@/db/schema/supplier'

import type { SupplierCreateDto, SupplierDto, SupplierFilterDto, SupplierUpdateDto } from './dto/supplier.dto'

const cache = bento.namespace('supplier')

export class SupplierRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	#clearCache(id?: number): Promise<void> {
		return record('SupplierRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierRepo.getListPaginated', async () => {
			const { q, page, limit } = filter

			const searchCondition = q
				? or(ilike(suppliersTable.name, `%${q}%`), ilike(suppliersTable.code, `%${q}%`))
				: undefined

			const where = and(isNull(suppliersTable.deletedAt), searchCondition)

			return paginate<SupplierDto>({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(suppliersTable)
						.where(where)
						.orderBy(sortBy(suppliersTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(suppliersTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await db
						.select()
						.from(suppliersTable)
						.where(and(eq(suppliersTable.id, id), isNull(suppliersTable.deletedAt)))
						.limit(1)
						.then(takeFirst)

					return res ?? skip()
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: SupplierCreateDto, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await db
				.insert(suppliersTable)
				.values({ ...data, ...metadata })
				.returning({ id: suppliersTable.id })

			void this.#clearCache()
			return res?.id
		})
	}

	async update(data: SupplierUpdateDto, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.update', async () => {
			const { id, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await db
				.update(suppliersTable)
				.set({ ...rest, ...metadata })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			void this.#clearCache(res?.id)
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.remove', async () => {
			const [res] = await db
				.update(suppliersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			void this.#clearCache(id)
			return res?.id
		})
	}
}

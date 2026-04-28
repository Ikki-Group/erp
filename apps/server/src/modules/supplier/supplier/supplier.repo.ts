import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { suppliersTable } from '@/db/schema/supplier'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from './supplier.dto'

const SUPPLIER_CACHE_NAMESPACE = 'supplier'

export class SupplierRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(SUPPLIER_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'SupplierRepo cache invalidation failed')
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
					this.db
						.select()
						.from(suppliersTable)
						.where(where)
						.orderBy(sortBy(suppliersTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(suppliersTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
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
			const [res] = await this.db
				.insert(suppliersTable)
				.values({ ...data, ...metadata })
				.returning({ id: suppliersTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(data: SupplierUpdateDto, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.update', async () => {
			const { id, ...rest } = data
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(suppliersTable)
				.set({ ...rest, ...metadata })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			this.#clearCacheAsync(res?.id)
			return res?.id
		})
	}

	async remove(id: number, actorId: number): Promise<number | undefined> {
		return record('SupplierRepo.remove', async () => {
			const [res] = await this.db
				.update(suppliersTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(suppliersTable.id, id))
				.returning({ id: suppliersTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}
}

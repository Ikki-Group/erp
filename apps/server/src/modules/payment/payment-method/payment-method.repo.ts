import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'

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

import { paymentMethodConfigsTable } from '@/db/schema'

import * as dto from './payment-method.dto'

const PAYMENT_METHOD_CONFIG_CACHE_NAMESPACE = 'payment-method-config'

export class PaymentMethodConfigRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(PAYMENT_METHOD_CONFIG_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(id?: number): Promise<void> {
		return record('PaymentMethodConfigRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'PaymentMethodConfigRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.PaymentMethodConfigFilterDto,
	): Promise<WithPaginationResult<dto.PaymentMethodConfigDto>> {
		return record('PaymentMethodConfigRepo.getListPaginated', async () => {
			const { q, page, limit, category, isEnabled } = filter
			const where = and(
				q === undefined ? undefined : searchFilter(paymentMethodConfigsTable.name, q),
				category === undefined ? undefined : eq(paymentMethodConfigsTable.category, category),
				isEnabled === undefined ? undefined : eq(paymentMethodConfigsTable.isEnabled, isEnabled),
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(paymentMethodConfigsTable)
						.where(where)
						.orderBy(paymentMethodConfigsTable.name)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(paymentMethodConfigsTable).where(where),
			})

			return {
				...result,
				data: result.data.map((item) => ({ ...item })),
			}
		})
	}

	async getList(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigRepo.getList', async () => {
			const data = await this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.db.select().from(paymentMethodConfigsTable),
			})
			return data.map((item) => ({ ...item }))
		})
	}

	async getEnabled(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigRepo.getEnabled', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodConfigsTable)
				.where(eq(paymentMethodConfigsTable.isEnabled, true))
			return data.map((item) => ({ ...item }))
		})
	}

	async getById(id: number): Promise<dto.PaymentMethodConfigDto | undefined> {
		return record('PaymentMethodConfigRepo.getById', async () => {
			const res = await this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const data = await this.db
						.select()
						.from(paymentMethodConfigsTable)
						.where(eq(paymentMethodConfigsTable.id, id))
						.limit(1)
						.then(takeFirst)

					return data ?? skip()
				},
			})
			return res
		})
	}

	async count(): Promise<number> {
		return record('PaymentMethodConfigRepo.count', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => {
					return this.db
						.select({ count: count() })
						.from(paymentMethodConfigsTable)
						.then((rows) => rows[0]?.count ?? 0)
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: dto.PaymentMethodConfigCreateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(paymentMethodConfigsTable)
				.values({ ...data, ...metadata })
				.returning({ id: paymentMethodConfigsTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(
		data: dto.PaymentMethodConfigUpdateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(paymentMethodConfigsTable)
				.set({ ...data, ...metadata })
				.where(eq(paymentMethodConfigsTable.id, data.id))
				.returning({ id: paymentMethodConfigsTable.id })

			this.#clearCacheAsync(data.id)
			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.remove', async () => {
			const [res] = await this.db
				.delete(paymentMethodConfigsTable)
				.where(eq(paymentMethodConfigsTable.id, id))
				.returning({ id: paymentMethodConfigsTable.id })

			this.#clearCacheAsync(id)
			return res?.id
		})
	}

	async seed(data: (dto.PaymentMethodConfigCreateDto & { createdBy: number })[]) {
		return record('PaymentMethodConfigRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(paymentMethodConfigsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: paymentMethodConfigsTable.name,
						set: {
							type: d.type,
							category: d.category,
							isEnabled: d.isEnabled,
							isDefault: d.isDefault,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})

				this.#clearCacheAsync()
			}
		})
	}
}

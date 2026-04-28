import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull, or } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import {
	paginate,
	searchFilter,
	stampCreate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { logger } from '@/core/logger'

import { expendituresTable } from '@/db/schema/finance'

import type { ExpenditureCreateDto, ExpenditureDto, ExpenditureFilterDto } from './expenditure.dto'

const EXPENDITURE_CACHE_NAMESPACE = 'finance.expenditure'

export class ExpenditureRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(EXPENDITURE_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(): Promise<void> {
		await this.cache.deleteMany({ keys: [CACHE_KEY_DEFAULT.list] })
	}

	#clearCacheAsync(): void {
		void this.#clearCache().catch((error: unknown) => {
			logger.error(error, 'ExpenditureRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: ExpenditureFilterDto,
	): Promise<WithPaginationResult<ExpenditureDto>> {
		return record('ExpenditureRepo.getListPaginated', async () => {
			const key = `list.${JSON.stringify(filter)}`

			return this.cache.getOrSet({
				key,
				factory: async () => {
					const { q, type, status, locationId } = filter

					const where = and(
						isNull(expendituresTable.deletedAt),
						q
							? or(
									searchFilter(expendituresTable.title, q),
									searchFilter(expendituresTable.description, q),
								)
							: undefined,
						type ? eq(expendituresTable.type, type) : undefined,
						status ? eq(expendituresTable.status, status) : undefined,
						locationId ? eq(expendituresTable.locationId, locationId) : undefined,
					)

					const result = await paginate({
						data: ({ limit: l, offset }) =>
							this.db
								.select()
								.from(expendituresTable)
								.where(where)
								.limit(l)
								.offset(offset)
								.orderBy(desc(expendituresTable.date)),
						pq: filter,
						countQuery: this.db.select({ count: count() }).from(expendituresTable).where(where),
					})

					return {
						...result,
						data: result.data as unknown as ExpenditureDto[],
					}
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: ExpenditureCreateDto, actorId: number) {
		return record('ExpenditureRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [result] = await this.db
				.insert(expendituresTable)
				.values({
					...data,
					amount: data.amount.toString(),
					...metadata,
				})
				.returning({ id: expendituresTable.id })

			if (!result) throw new Error('Failed to create expenditure')
			this.#clearCacheAsync()
			return result
		})
	}
}

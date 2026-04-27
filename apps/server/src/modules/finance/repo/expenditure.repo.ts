import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { paginate, searchFilter, stampCreate, type WithPaginationResult } from '@/core/database'


import { db } from '@/db'
import { expendituresTable } from '@/db/schema/finance'

import type {
	ExpenditureCreateDto,
	ExpenditureDto,
	ExpenditureFilterDto,
} from '../dto/expenditure.dto'

const cache = bento.namespace('finance.expenditure')

export class ExpenditureRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(): Promise<void> {
		await cache.deleteMany({ keys: [CACHE_KEY_DEFAULT.list] })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: ExpenditureFilterDto,
	): Promise<WithPaginationResult<ExpenditureDto>> {
		return record('ExpenditureRepo.getListPaginated', async () => {
			const key = `list.${JSON.stringify(filter)}`

			return cache.getOrSet({
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
							db
								.select()
								.from(expendituresTable)
								.where(where)
								.limit(l)
								.offset(offset)
								.orderBy(desc(expendituresTable.date)),
						pq: filter,
						countQuery: db.select({ count: count() }).from(expendituresTable).where(where),
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
			const [result] = await db
				.insert(expendituresTable)
				.values({
					...data,
					amount: data.amount.toString(),
					...metadata,
				})
				.returning()

			if (!result) throw new Error('Failed to create expenditure record')
			void this.#clearCache()
			return result
		})
	}
}

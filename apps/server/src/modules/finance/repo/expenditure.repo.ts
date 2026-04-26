import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, isNull, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { searchFilter, stampCreate, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { expendituresTable } from '@/db/schema/finance'

import type { ExpenditureCreateDto, ExpenditureFilterDto } from '../dto/expenditure.dto'

const cache = bento.namespace('finance.expenditure')

export class ExpenditureRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(): Promise<void> {
		await cache.deleteMany({ keys: [CACHE_KEY_DEFAULT.list] })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: ExpenditureFilterDto): Promise<any[]> {
		return record('ExpenditureRepo.getListPaginated', async () => {
			const { page, limit } = filter
			const key = `list.${JSON.stringify(filter)}`

			return cache.getOrSet({
				key,
				factory: async () => {
					const offset = (page - 1) * limit
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

					return db
						.select()
						.from(expendituresTable)
						.where(where)
						.limit(limit)
						.offset(offset)
						.orderBy(desc(expendituresTable.date))
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

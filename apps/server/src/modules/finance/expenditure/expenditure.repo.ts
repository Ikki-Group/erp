/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { expendituresTable } from '@/db/schema/finance'

import type { ExpenditureCreateDto, ExpenditureDto, ExpenditureFilterDto } from './expenditure.dto'

export class ExpenditureRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: ExpenditureFilterDto,
	): Promise<WithPaginationResult<ExpenditureDto>> {
		return record('ExpenditureRepo.getListPaginated', async () => {
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
			return result
		})
	}
}

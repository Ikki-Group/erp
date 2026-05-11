import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, exists, ilike, inArray, notExists, or } from 'drizzle-orm'

import { paginate, sortBy, type DbClient, type WithPaginationResult } from '@/core/database'

import { materialLocationsTable, materialsTable } from '@/db/schema'

import type { MaterialDto } from '../material-master/material.dto'
import type { MaterialListFilterDto } from './material-query.dto'

export class MaterialQueryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: MaterialListFilterDto,
	): Promise<WithPaginationResult<MaterialDto>> {
		return record('MaterialRepo.getListPaginated', async () => {
			const { search, type, categoryId, locationIds, excludeLocationIds } = filter

			const searchCondition = search
				? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
				: undefined

			const locationInclude =
				locationIds && locationIds.length > 0
					? exists(
							this.db
								.select({ _: materialLocationsTable.materialId })
								.from(materialLocationsTable)
								.where(
									and(
										eq(materialLocationsTable.materialId, materialsTable.id),
										inArray(materialLocationsTable.locationId, locationIds),
									),
								),
						)
					: undefined

			const locationExclude =
				excludeLocationIds && excludeLocationIds.length > 0
					? notExists(
							this.db
								.select({ _: materialLocationsTable.materialId })
								.from(materialLocationsTable)
								.where(
									and(
										eq(materialLocationsTable.materialId, materialsTable.id),
										inArray(materialLocationsTable.locationId, excludeLocationIds),
									),
								),
						)
					: undefined

			const where = and(
				searchCondition,
				type ? eq(materialsTable.type, type) : undefined,
				categoryId === undefined ? undefined : eq(materialsTable.categoryId, categoryId),
				locationInclude,
				locationExclude,
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(materialsTable)
						.where(where)
						.orderBy(sortBy(materialsTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq: filter,
				countQuery: this.db.select({ count: count() }).from(materialsTable).where(where),
			})

			return result
		})
	}
}

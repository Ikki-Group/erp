import { and, eq, isNull, or, sql, lte } from 'drizzle-orm'

import { db } from '@/db'
import { locationsTable } from '@/db/schema/location'
import { materialLocationsTable, materialsTable, uomsTable } from '@/db/schema/material'

import type { StockAlertFilterDto } from '../dto'

export class StockAlertService {
	async handleAlerts(filter: StockAlertFilterDto, pagination: { page: number; limit: number }) {
		const { page, limit } = pagination
		const offset = (page - 1) * limit

		const conditions = [
			isNull(materialLocationsTable.deletedAt),
			isNull(materialsTable.deletedAt),
			filter.locationId ? eq(materialLocationsTable.locationId, filter.locationId) : undefined,
		]

		if (filter.type === 'below_min') {
			conditions.push(lte(materialLocationsTable.currentQty, materialLocationsTable.minStock))
		} else if (filter.type === 'below_reorder') {
			conditions.push(lte(materialLocationsTable.currentQty, materialLocationsTable.reorderPoint))
		} else {
			conditions.push(
				or(
					lte(materialLocationsTable.currentQty, materialLocationsTable.minStock),
					lte(materialLocationsTable.currentQty, materialLocationsTable.reorderPoint),
				),
			)
		}

		const whereClause = and(...conditions.filter(Boolean))

		const [data, countRes] = await Promise.all([
			db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					materialSku: materialsTable.sku,
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					uomCode: uomsTable.code,
					currentQty: sql<number>`CAST(${materialLocationsTable.currentQty} AS FLOAT)`,
					minStock: sql<number>`CAST(${materialLocationsTable.minStock} AS FLOAT)`,
					reorderPoint: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
				.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
				.where(whereClause)
				.limit(limit)
				.offset(offset)
				.orderBy(materialLocationsTable.currentQty),
			db
				.select({ count: sql<number>`cast(count(*) as int)` })
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause),
		])

		const total = countRes[0]?.count ?? 0

		return { data, meta: { page, limit, total: total, totalPages: Math.ceil(total / limit) } }
	}

	async handleCount(filter: StockAlertFilterDto) {
		const conditions = [
			isNull(materialLocationsTable.deletedAt),
			isNull(materialsTable.deletedAt),
			filter.locationId ? eq(materialLocationsTable.locationId, filter.locationId) : undefined,
		]

		if (filter.type === 'below_min') {
			conditions.push(lte(materialLocationsTable.currentQty, materialLocationsTable.minStock))
		} else if (filter.type === 'below_reorder') {
			conditions.push(lte(materialLocationsTable.currentQty, materialLocationsTable.reorderPoint))
		} else {
			conditions.push(
				or(
					lte(materialLocationsTable.currentQty, materialLocationsTable.minStock),
					lte(materialLocationsTable.currentQty, materialLocationsTable.reorderPoint),
				),
			)
		}

		const whereClause = and(...conditions.filter(Boolean))

		const countRes = await db
			.select({ count: sql<number>`cast(count(*) as int)` })
			.from(materialLocationsTable)
			.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
			.where(whereClause)

		return { count: countRes[0]?.count ?? 0 }
	}
}

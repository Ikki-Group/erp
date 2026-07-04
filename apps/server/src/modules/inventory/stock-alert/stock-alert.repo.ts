import { and, eq, lte, or, sql } from 'drizzle-orm'

import {
	locationsTable,
	materialLocationsTable,
	materialsTable,
	materialStockSnapshotsTable,
	uomsTable,
} from '@/db/schema'

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { StockAlertCountFilterDto, StockAlertFilterDto, StockAlertSelectDto } from './stock-alert.contract'

export interface IStockAlertRepo {
	readonly db: DbContext
	findAlertsPage(filter: StockAlertFilterDto, db?: DbContext): Promise<WithPaginationResult<StockAlertSelectDto>>
	findAlertCount(filter: StockAlertCountFilterDto, db?: DbContext): Promise<{ count: number }>
}

export class StockAlertRepo implements IStockAlertRepo {
	constructor(readonly db: DbContext) {}

	#buildAlertConditions(filter: StockAlertFilterDto | StockAlertCountFilterDto) {
		const conditions = [
			filter.locationId ? eq(materialLocationsTable.locationId, filter.locationId) : undefined,
		]

		if (filter.type === 'below_min') {
			conditions.push(lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.minStock))
		} else if (filter.type === 'below_reorder') {
			conditions.push(lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.reorderPoint))
		} else {
			conditions.push(
				or(
					lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.minStock),
					lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.reorderPoint),
				),
			)
		}

		return and(...conditions.filter(Boolean))
	}

	async findAlertsPage(
		filter: StockAlertFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<StockAlertSelectDto>> {
		const page = filter.page ?? 1
		const limit = filter.limit ?? 20
		const offset = (page - 1) * limit
		const whereClause = this.#buildAlertConditions(filter)

		const [data, countRes] = await Promise.all([
			db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					materialSku: materialsTable.sku,
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					uomCode: uomsTable.code,
					currentQty: sql<number>`CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)`,
					minStock: sql<number>`CAST(${materialLocationsTable.minStock} AS FLOAT)`,
					reorderPoint: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
				.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
				.leftJoin(
					materialStockSnapshotsTable,
					and(
						eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
						eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
					),
				)
				.where(whereClause)
				.limit(limit)
				.offset(offset)
				.orderBy(materialStockSnapshotsTable.currentQty),
			db
				.select({ count: sql<number>`cast(count(*) as int)` })
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.leftJoin(
					materialStockSnapshotsTable,
					and(
						eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
						eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
					),
				)
				.where(whereClause),
		])

		const total = countRes[0]?.count ?? 0

		return {
			data,
			meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
		}
	}

	async findAlertCount(
		filter: StockAlertCountFilterDto,
		db: DbContext = this.db,
	): Promise<{ count: number }> {
		const whereClause = this.#buildAlertConditions(filter)

		const countRes = await db
			.select({ count: sql<number>`cast(count(*) as int)` })
			.from(materialLocationsTable)
			.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(whereClause)

		return { count: countRes[0]?.count ?? 0 }
	}
}

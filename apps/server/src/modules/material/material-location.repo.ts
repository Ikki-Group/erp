import { and, count, eq, inArray } from 'drizzle-orm'

import type { WithPaginationResult } from '@/core/database/pagination'

import { locationsTable, materialLocationsTable, materialsTable, uomsTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/infra/database'

import type {
	MaterialLocationFilterSchema,
	MaterialLocationSchema,
	MaterialLocationStockSchema,
	MaterialLocationWithLocationSchema,
	MaterialLocationAssignSchema,
	MaterialLocationUnassignSchema,
	MaterialLocationCreateSchema,
	MaterialLocationUpdateSchema,
} from './material-location.schema'

export class MaterialLocationRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<MaterialLocationSchema | undefined> {
		return this.db
			.select()
			.from(materialLocationsTable)
			.where(eq(materialLocationsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async getByMaterialId(materialId: number): Promise<MaterialLocationSchema[]> {
		return this.db
			.select()
			.from(materialLocationsTable)
			.where(eq(materialLocationsTable.materialId, materialId))
	}

	async getByLocationId(locationId: number): Promise<MaterialLocationSchema[]> {
		return this.db
			.select()
			.from(materialLocationsTable)
			.where(eq(materialLocationsTable.locationId, locationId))
	}

	async getWithLocationByMaterialId(
		materialId: number,
	): Promise<MaterialLocationWithLocationSchema[]> {
		return this.db
			.select({
				id: materialLocationsTable.id,
				materialId: materialLocationsTable.materialId,
				locationId: materialLocationsTable.locationId,
				minStock: materialLocationsTable.minStock,
				maxStock: materialLocationsTable.maxStock,
				reorderPoint: materialLocationsTable.reorderPoint,
				currentQty: materialLocationsTable.currentQty,
				currentAvgCost: materialLocationsTable.currentAvgCost,
				currentValue: materialLocationsTable.currentValue,
				createdAt: materialLocationsTable.createdAt,
				updatedAt: materialLocationsTable.updatedAt,
				createdBy: materialLocationsTable.createdBy,
				updatedBy: materialLocationsTable.updatedBy,
				location: locationsTable,
			})
			.from(materialLocationsTable)
			.innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
			.where(eq(materialLocationsTable.materialId, materialId))
	}

	async getStockByLocationPaginated(
		filter: MaterialLocationFilterSchema,
	): Promise<WithPaginationResult<MaterialLocationStockSchema>> {
		const { locationId, q, page, limit } = filter

		const searchCondition = searchFilter(materialsTable.name, q)
		const where = and(eq(materialLocationsTable.locationId, locationId), searchCondition)

		return paginate<MaterialLocationStockSchema>({
			data: ({ limit: l, offset }) =>
				this.db
					.select({
						id: materialLocationsTable.id,
						materialId: materialLocationsTable.materialId,
						locationId: materialLocationsTable.locationId,
						materialName: materialsTable.name,
						materialSku: materialsTable.sku,
						baseUomId: materialsTable.baseUomId,
						minStock: materialLocationsTable.minStock,
						maxStock: materialLocationsTable.maxStock,
						reorderPoint: materialLocationsTable.reorderPoint,
						currentQty: materialLocationsTable.currentQty,
						currentAvgCost: materialLocationsTable.currentAvgCost,
						currentValue: materialLocationsTable.currentValue,
						uom: uomsTable,
					})
					.from(materialLocationsTable)
					.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
					.innerJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
					.where(where)
					.orderBy(sortBy(materialLocationsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: this.db
				.select({ count: count() })
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(where),
		})
	}

	async getListPaginated(
		filter: MaterialLocationFilterSchema,
	): Promise<WithPaginationResult<MaterialLocationSchema>> {
		const { locationId, q, page, limit } = filter

		const where = and(
			locationId ? eq(materialLocationsTable.locationId, locationId) : undefined,
			searchFilter(materialLocationsTable.materialId, q),
		)

		return paginate<MaterialLocationSchema>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(materialLocationsTable)
					.where(where)
					.orderBy(sortBy(materialLocationsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(materialLocationsTable).where(where),
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: MaterialLocationCreateSchema, actorId: number): Promise<number | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(materialLocationsTable)
			.values({ ...data, ...metadata })
			.returning({ id: materialLocationsTable.id })

		return res?.id
	}

	async batchAssign(data: MaterialLocationAssignSchema, actorId: number): Promise<number> {
		const { locationIds, materialIds } = data

		const existing = await this.db
			.select({
				materialId: materialLocationsTable.materialId,
				locationId: materialLocationsTable.locationId,
			})
			.from(materialLocationsTable)
			.where(
				and(
					inArray(materialLocationsTable.locationId, locationIds),
					inArray(materialLocationsTable.materialId, materialIds),
				),
			)

		const existingSet = new Set(existing.map((e) => `${e.locationId}-${e.materialId}`))
		const metadata = stampCreate(actorId)
		const docs: (typeof materialLocationsTable.$inferInsert)[] = []

		for (const locationId of locationIds) {
			for (const materialId of materialIds) {
				if (!existingSet.has(`${locationId}-${materialId}`)) {
					docs.push({ materialId, locationId, ...metadata })
				}
			}
		}

		if (docs.length === 0) return 0

		await this.db.insert(materialLocationsTable).values(docs)
		return docs.length
	}

	async unassign(data: MaterialLocationUnassignSchema): Promise<number | undefined> {
		const { materialId, locationId } = data

		const [res] = await this.db
			.delete(materialLocationsTable)
			.where(
				and(
					eq(materialLocationsTable.materialId, materialId),
					eq(materialLocationsTable.locationId, locationId),
				),
			)
			.returning({ id: materialLocationsTable.id })

		return res?.id
	}

	async update(
		id: number,
		data: MaterialLocationUpdateSchema,
		actorId: number,
	): Promise<number | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(materialLocationsTable)
			.set({ ...data, ...metadata })
			.where(eq(materialLocationsTable.id, id))
			.returning({ id: materialLocationsTable.id })

		return res?.id
	}

	async remove(id: number): Promise<number | undefined> {
		const [res] = await this.db
			.delete(materialLocationsTable)
			.where(eq(materialLocationsTable.id, id))
			.returning({ id: materialLocationsTable.id })

		return res?.id
	}
}

/* eslint-disable @typescript-eslint/no-deprecated, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, inArray, isNull, or } from 'drizzle-orm'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { locationsTable, materialLocationsTable, materialsTable, uomsTable } from '@/db/schema'

import type {
	MaterialLocationDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationWithLocationDto,
} from './material-location.dto'

export class MaterialLocationRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getOne(materialId: number, locationId: number): Promise<MaterialLocationDto | null> {
		return record('MaterialLocationRepo.getOne', async () => {
			const [result] = await this.db
				.select()
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						eq(materialLocationsTable.locationId, locationId),
						isNull(materialLocationsTable.deletedAt),
					),
				)

			if (!result) return null
			return {
				...result,
				minStock: result.minStock,
				maxStock: result.maxStock ?? null,
				reorderPoint: result.reorderPoint,
				currentQty: result.currentQty,
				currentAvgCost: result.currentAvgCost,
				currentValue: result.currentValue,
			}
		})
	}

	async getByMaterialId(materialId: number): Promise<MaterialLocationDto[]> {
		return record('MaterialLocationRepo.getByMaterialId', async () => {
			const results = await this.db
				.select()
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						isNull(materialLocationsTable.deletedAt),
					),
				)
			return results.map((r) =>
				Object.assign({}, r, {
					minStock: r.minStock,
					maxStock: r.maxStock ?? null,
					reorderPoint: r.reorderPoint,
					currentQty: r.currentQty,
					currentAvgCost: r.currentAvgCost,
					currentValue: r.currentValue,
				}),
			)
		})
	}

	async getByLocationId(locationId: number): Promise<MaterialLocationDto[]> {
		return record('MaterialLocationRepo.getByLocationId', async () => {
			const results = await this.db
				.select()
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.locationId, locationId),
						isNull(materialLocationsTable.deletedAt),
					),
				)
			return results.map((r) =>
				Object.assign({}, r, {
					minStock: r.minStock,
					maxStock: r.maxStock ?? null,
					reorderPoint: r.reorderPoint,
					currentQty: r.currentQty,
					currentAvgCost: r.currentAvgCost,
					currentValue: r.currentValue,
				}),
			)
		})
	}

	async getLocationsByMaterial(materialId: number): Promise<MaterialLocationWithLocationDto[]> {
		return record('MaterialLocationRepo.getLocationsByMaterial', async () => {
			const assignments = await this.db
				.select({ assignment: materialLocationsTable, location: locationsTable })
				.from(materialLocationsTable)
				.innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						isNull(materialLocationsTable.deletedAt),
					),
				)

			return assignments.map((row) =>
				Object.assign({}, row.assignment, {
					minStock: row.assignment.minStock,
					maxStock: row.assignment.maxStock ?? null,
					reorderPoint: row.assignment.reorderPoint,
					currentQty: row.assignment.currentQty,
					currentAvgCost: row.assignment.currentAvgCost,
					currentValue: row.assignment.currentValue,
					location: row.location,
				}),
			)
		})
	}

	async getStockByLocationPaginated(
		filter: MaterialLocationFilterDto,
	): Promise<WithPaginationResult<MaterialLocationStockDto>> {
		return record('MaterialLocationRepo.getStockByLocationPaginated', async () => {
			const { locationId, q, page, limit } = filter

			const searchCondition = q
				? or(ilike(materialsTable.name, `%${q}%`), ilike(materialsTable.sku, `%${q}%`))
				: undefined

			const where = and(
				eq(materialLocationsTable.locationId, locationId),
				isNull(materialLocationsTable.deletedAt),
				searchCondition,
			)

			const result = await paginate({
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

			const data = result.data.map((stock) => ({
				...stock,
				minStock: stock.minStock,
				maxStock: stock.maxStock ?? null,
				reorderPoint: stock.reorderPoint,
				currentQty: stock.currentQty,
				currentAvgCost: stock.currentAvgCost,
				currentValue: stock.currentValue,
			}))

			return { data, meta: result.meta }
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async batchAssign(
		materialIds: number[],
		locationIds: number[],
		actorId: number,
	): Promise<number> {
		return record('MaterialLocationRepo.batchAssign', async () => {
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
		})
	}

	async unassign(materialId: number, locationId: number): Promise<number | undefined> {
		return record('MaterialLocationRepo.unassign', async () => {
			const [result] = await this.db
				.delete(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						eq(materialLocationsTable.locationId, locationId),
					),
				)
				.returning({ id: materialLocationsTable.id })

			if (result) {
				return result.id
			}
			return undefined
		})
	}

	async updateConfig(
		id: number,
		data: {
			minStock?: number | undefined
			maxStock?: number | null | undefined
			reorderPoint?: number | undefined
		},
		actorId: number,
	): Promise<number | undefined> {
		return record('MaterialLocationRepo.updateConfig', async () => {
			const [result] = await this.db
				.update(materialLocationsTable)
				.set({
					minStock: data.minStock?.toString(),
					maxStock: data.maxStock?.toString(),
					reorderPoint: data.reorderPoint?.toString(),
					...stampUpdate(actorId),
				})
				.where(eq(materialLocationsTable.id, id))
				.returning({ id: materialLocationsTable.id })

			if (result) {
				return result.id
			}
			return undefined
		})
	}

	async updateCurrentStock(
		materialId: number,
		locationId: number,
		stock: { currentQty: number; currentAvgCost: number; currentValue: number },
		actorId: number,
		tx: any = this.db,
	): Promise<void> {
		return record('MaterialLocationRepo.updateCurrentStock', async () => {
			await tx
				.update(materialLocationsTable)
				.set({
					currentQty: stock.currentQty.toString(),
					currentAvgCost: stock.currentAvgCost.toString(),
					currentValue: stock.currentValue.toString(),
					...stampUpdate(actorId),
				})
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						eq(materialLocationsTable.locationId, locationId),
					),
				)
		})
	}
}

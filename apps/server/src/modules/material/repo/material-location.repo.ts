import { and, count, eq, ilike, inArray, or } from 'drizzle-orm'

import {
	locationsTable,
	materialLocationsTable,
	materialStockSnapshotsTable,
	materialsTable,
	uomsTable,
} from '@/db/schema'

import { paginate, sortBy, type DbClient, type DbTx } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { MaterialLocation } from '../domain/material-location.entity'
import type {
	IMaterialLocationRepo,
	LocationStockFilter,
	MaterialLocationStock,
	MaterialLocationWithLocation,
} from '../domain/ports'

export class MaterialLocationRepo implements IMaterialLocationRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getOne(materialId: number, locationId: number): Promise<MaterialLocation | null> {
		const [result] = await this.db
			.select({
				config: materialLocationsTable,
				snapshot: materialStockSnapshotsTable,
			})
			.from(materialLocationsTable)
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(
				and(
					eq(materialLocationsTable.materialId, materialId),
					eq(materialLocationsTable.locationId, locationId),
				),
			)

		if (!result) return null
		return {
			...result.config,
			maxStock: result.config.maxStock ?? null,
			currentQty: result.snapshot?.currentQty ?? '0',
			currentAvgCost: result.snapshot?.currentAvgCost ?? '0',
			currentValue: result.snapshot?.currentValue ?? '0',
		}
	}

	async getByMaterialId(materialId: number): Promise<MaterialLocation[]> {
		const results = await this.db
			.select({
				config: materialLocationsTable,
				snapshot: materialStockSnapshotsTable,
			})
			.from(materialLocationsTable)
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(eq(materialLocationsTable.materialId, materialId))

		return results.map((r) => ({
			...r.config,
			maxStock: r.config.maxStock ?? null,
			currentQty: r.snapshot?.currentQty ?? '0',
			currentAvgCost: r.snapshot?.currentAvgCost ?? '0',
			currentValue: r.snapshot?.currentValue ?? '0',
		}))
	}

	async getByLocationId(locationId: number): Promise<MaterialLocation[]> {
		const results = await this.db
			.select({
				config: materialLocationsTable,
				snapshot: materialStockSnapshotsTable,
			})
			.from(materialLocationsTable)
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(eq(materialLocationsTable.locationId, locationId))

		return results.map((r) => ({
			...r.config,
			maxStock: r.config.maxStock ?? null,
			currentQty: r.snapshot?.currentQty ?? '0',
			currentAvgCost: r.snapshot?.currentAvgCost ?? '0',
			currentValue: r.snapshot?.currentValue ?? '0',
		}))
	}

	async getLocationsByMaterial(materialId: number): Promise<MaterialLocationWithLocation[]> {
		const assignments = await this.db
			.select({
				assignment: materialLocationsTable,
				location: locationsTable,
				snapshot: materialStockSnapshotsTable,
			})
			.from(materialLocationsTable)
			.innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(eq(materialLocationsTable.materialId, materialId))

		return assignments.map((row) => ({
			...row.assignment,
			maxStock: row.assignment.maxStock ?? null,
			currentQty: row.snapshot?.currentQty ?? '0',
			currentAvgCost: row.snapshot?.currentAvgCost ?? '0',
			currentValue: row.snapshot?.currentValue ?? '0',
			location: row.location,
		}))
	}

	async getStockByLocationPaginated(
		filter: LocationStockFilter,
	): Promise<WithPaginationResult<MaterialLocationStock>> {
		const { locationId, q, page, limit } = filter

		const searchCondition = q
			? or(ilike(materialsTable.name, `%${q}%`), ilike(materialsTable.sku, `%${q}%`))
			: undefined

		const where = and(eq(materialLocationsTable.locationId, locationId), searchCondition)

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
						currentQty: materialStockSnapshotsTable.currentQty,
						currentAvgCost: materialStockSnapshotsTable.currentAvgCost,
						currentValue: materialStockSnapshotsTable.currentValue,
						uom: uomsTable,
					})
					.from(materialLocationsTable)
					.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
					.innerJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
					.leftJoin(
						materialStockSnapshotsTable,
						and(
							eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
							eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
						),
					)
					.where(where)
					.orderBy(sortBy(materialLocationsTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: () =>
				this.db
					.select({ count: count() })
					.from(materialLocationsTable)
					.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
					.where(where),
		})

		const data = result.data.map((stock) => ({
			...stock,
			maxStock: stock.maxStock ?? null,
			currentQty: stock.currentQty ?? '0',
			currentAvgCost: stock.currentAvgCost ?? '0',
			currentValue: stock.currentValue ?? '0',
		}))

		return { data, meta: result.meta }
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async batchAssign(
		materialIds: number[],
		locationIds: number[],
		actorId: number,
	): Promise<number> {
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

	async unassign(materialId: number, locationId: number): Promise<number | undefined> {
		const [result] = await this.db
			.delete(materialLocationsTable)
			.where(
				and(
					eq(materialLocationsTable.materialId, materialId),
					eq(materialLocationsTable.locationId, locationId),
				),
			)
			.returning({ id: materialLocationsTable.id })

		return result?.id
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

		return result?.id
	}

	async updateCurrentStock(
		materialId: number,
		locationId: number,
		stock: { currentQty: number; currentAvgCost: number; currentValue: number },
		_actorId: number,
		tx: DbTx | DbClient = this.db,
	): Promise<void> {
		await tx
			.insert(materialStockSnapshotsTable)
			.values({
				materialId,
				locationId,
				currentQty: stock.currentQty.toString(),
				currentAvgCost: stock.currentAvgCost.toString(),
				currentValue: stock.currentValue.toString(),
				snapshotAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [materialStockSnapshotsTable.materialId, materialStockSnapshotsTable.locationId],
				set: {
					currentQty: stock.currentQty.toString(),
					currentAvgCost: stock.currentAvgCost.toString(),
					currentValue: stock.currentValue.toString(),
					snapshotAt: new Date(),
				},
			})
	}
}

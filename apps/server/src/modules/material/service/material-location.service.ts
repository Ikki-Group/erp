import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, inArray, or } from 'drizzle-orm'

import { paginate, sortBy, stampCreate, stampUpdate } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import type { DbTx } from '@/core/database'
import { locationsTable, materialLocationsTable, materialsTable, uomsTable } from '@/db/schema'
import type { LocationServiceModule } from '@/modules/location'

import type {
  MaterialLocationAssignDto,
  MaterialLocationConfigDto,
  MaterialLocationDto,
  MaterialLocationFilterDto,
  MaterialLocationStockDto,
  MaterialLocationUnassignDto,
  MaterialLocationWithLocationDto,
} from '../dto'
import type { MaterialService } from './material.service'

const err = {
  notFound: (id: number) =>
    new NotFoundError(`Material-Location assignment with ID ${id} not found`, 'MATERIAL_LOCATION_NOT_FOUND'),
  notAssigned: (materialId: number, locationId: number) =>
    new NotFoundError(
      `Material ${materialId} is not assigned to location ${locationId}`,
      'MATERIAL_NOT_ASSIGNED_TO_LOCATION',
    ),
  alreadyAssigned: (materialId: number, locationId: number) =>
    new ConflictError(
      `Material ${materialId} is already assigned to location ${locationId}`,
      'MATERIAL_LOCATION_ALREADY_ASSIGNED',
    ),
}

export class MaterialLocationService {
  constructor(
    private readonly materialSvc: MaterialService,
    private readonly locationSvc: LocationServiceModule,
  ) {}

  /* ─────────────────────── INTERNAL QUERIES ─────────────────────── */

  /** Get a specific material-location assignment */
  async findOne(materialId: number, locationId: number): Promise<MaterialLocationDto> {
    return record('MaterialLocationService.findOne', async () => {
      const [result] = await db
        .select()
        .from(materialLocationsTable)
        .where(
          and(eq(materialLocationsTable.materialId, materialId), eq(materialLocationsTable.locationId, locationId)),
        )

      if (!result) throw err.notAssigned(materialId, locationId)
      return {
        ...result,
        minStock: Number(result.minStock),
        maxStock: result.maxStock ? Number(result.maxStock) : null,
        reorderPoint: Number(result.reorderPoint),
        currentQty: Number(result.currentQty),
        currentAvgCost: Number(result.currentAvgCost),
        currentValue: Number(result.currentValue),
      }
    })
  }

  /** Get all assignments for a specific material */
  async findByMaterialId(materialId: number): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByMaterialId', async () => {
      const results = await db
        .select()
        .from(materialLocationsTable)
        .where(eq(materialLocationsTable.materialId, materialId))
      return results.map((r) =>
        Object.assign({}, r, {
          minStock: Number(r.minStock),
          maxStock: r.maxStock ? Number(r.maxStock) : null,
          reorderPoint: Number(r.reorderPoint),
          currentQty: Number(r.currentQty),
          currentAvgCost: Number(r.currentAvgCost),
          currentValue: Number(r.currentValue),
        }),
      )
    })
  }

  /** Get all assignments for a specific location */
  async findByLocationId(locationId: number): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByLocationId', async () => {
      const results = await db
        .select()
        .from(materialLocationsTable)
        .where(eq(materialLocationsTable.locationId, locationId))
      return results.map((r) =>
        Object.assign({}, r, {
          minStock: Number(r.minStock),
          maxStock: r.maxStock ? Number(r.maxStock) : null,
          reorderPoint: Number(r.reorderPoint),
          currentQty: Number(r.currentQty),
          currentAvgCost: Number(r.currentAvgCost),
          currentValue: Number(r.currentValue),
        }),
      )
    })
  }

  /* ──────────────────── HANDLER: ASSIGNMENTS ──────────────────── */

  /**
   * Assign multiple materials to multiple locations (batch).
   * Skips any that are already assigned (upsert-like).
   */
  async handleAssign(data: MaterialLocationAssignDto, actorId: number): Promise<{ assignedCount: number }> {
    return record('MaterialLocationService.handleAssign', async () => {
      const { locationIds, materialIds } = data

      // 1. Validate all locations exist
      for (const locId of locationIds) {
        await this.locationSvc.location.getById(locId)
      }

      // 2. Validate all materials exist
      for (const mId of materialIds) {
        await this.materialSvc.getById(mId)
      }

      // 3. Find already assigned combinations
      const existing = await db
        .select({ materialId: materialLocationsTable.materialId, locationId: materialLocationsTable.locationId })
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

      if (docs.length === 0) return { assignedCount: 0 }

      await db.insert(materialLocationsTable).values(docs)

      return { assignedCount: docs.length }
    })
  }

  /**
   * Unassign a material from a location.
   */
  async handleUnassign(data: MaterialLocationUnassignDto): Promise<{ id: number }> {
    return record('MaterialLocationService.handleUnassign', async () => {
      const { materialId, locationId } = data

      const [result] = await db
        .delete(materialLocationsTable)
        .where(
          and(eq(materialLocationsTable.materialId, materialId), eq(materialLocationsTable.locationId, locationId)),
        )
        .returning({ id: materialLocationsTable.id })

      if (!result) throw err.notAssigned(materialId, locationId)

      return { id: result.id }
    })
  }

  /* ──────────────── HANDLER: LIST LOCATIONS PER MATERIAL ──────────────── */

  /**
   * List all locations assigned to a material, enriched with location details.
   */
  async handleLocationsByMaterial(materialId: number): Promise<MaterialLocationWithLocationDto[]> {
    return record('MaterialLocationService.handleLocationsByMaterial', async () => {
      // Validate material exists
      await this.materialSvc.getById(materialId)

      const assignments = await db
        .select({ assignment: materialLocationsTable, location: locationsTable })
        .from(materialLocationsTable)
        .innerJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
        .where(eq(materialLocationsTable.materialId, materialId))

      return assignments.map((row) =>
        Object.assign({}, row.assignment, {
          minStock: Number(row.assignment.minStock),
          maxStock: row.assignment.maxStock ? Number(row.assignment.maxStock) : null,
          reorderPoint: Number(row.assignment.reorderPoint),
          currentQty: Number(row.assignment.currentQty),
          currentAvgCost: Number(row.assignment.currentAvgCost),
          currentValue: Number(row.assignment.currentValue),
          location: row.location,
        }),
      )
    })
  }

  /* ──────────────── HANDLER: STOCK LIST PER LOCATION ──────────────── */

  /**
   * List materials at a specific location with stock data (paginated).
   * Joining with material data.
   */
  async handleStockByLocation(
    filter: MaterialLocationFilterDto,
    pq: PaginationQuery,
  ): Promise<WithPaginationResult<MaterialLocationStockDto>> {
    return record('MaterialLocationService.handleStockByLocation', async () => {
      const { locationId, search } = filter

      // Validate location exists
      await this.locationSvc.location.getById(locationId)

      const searchCondition = search
        ? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`))
        : undefined

      const where = and(eq(materialLocationsTable.locationId, locationId), searchCondition)

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
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
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db
          .select({ count: count() })
          .from(materialLocationsTable)
          .innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
          .where(where),
      })

      const data = result.data.map((stock) => ({
        ...stock,
        minStock: Number(stock.minStock),
        maxStock: stock.maxStock ? Number(stock.maxStock) : null,
        reorderPoint: Number(stock.reorderPoint),
        currentQty: Number(stock.currentQty),
        currentAvgCost: Number(stock.currentAvgCost),
        currentValue: Number(stock.currentValue),
      }))

      return { data, meta: result.meta }
    })
  }

  /* ──────────────────── HANDLER: UPDATE CONFIG ──────────────────── */

  /**
   * Update per-location config (minStock, maxStock, reorderPoint).
   */
  async handleUpdateConfig(data: MaterialLocationConfigDto, actorId: number): Promise<{ id: number }> {
    return record('MaterialLocationService.handleUpdateConfig', async () => {
      const { id, ...update } = data

      const [result] = await db
        .update(materialLocationsTable)
        .set({
          ...update,
          minStock: update.minStock?.toString(),
          maxStock: update.maxStock?.toString(),
          reorderPoint: update.reorderPoint?.toString(),
          ...stampUpdate(actorId),
        })
        .where(eq(materialLocationsTable.id, id))
        .returning({ id: materialLocationsTable.id })

      if (!result) throw err.notFound(id)
      return { id: result.id }
    })
  }

  /* ──────────────── INVENTORY STOCK SYNC (called by inventory module) ──────────────── */

  /**
   * Update current stock snapshot. Called by the inventory module after recording a transaction.
   */
  async updateCurrentStock(
    materialId: number,
    locationId: number,
    stock: { currentQty: number; currentAvgCost: number; currentValue: number },
    actorId: number,
    tx: DbTx | typeof db = db,
  ): Promise<void> {
    return record('MaterialLocationService.updateCurrentStock', async () => {
      await tx
        .update(materialLocationsTable)
        .set({
          currentQty: stock.currentQty.toString(),
          currentAvgCost: stock.currentAvgCost.toString(),
          currentValue: stock.currentValue.toString(),
          ...stampUpdate(actorId),
        })
        .where(
          and(eq(materialLocationsTable.materialId, materialId), eq(materialLocationsTable.locationId, locationId)),
        )
    })
  }
}

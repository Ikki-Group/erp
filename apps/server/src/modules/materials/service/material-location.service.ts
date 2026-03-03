import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, ilike, inArray, or } from 'drizzle-orm'

import { paginate, sortBy, stampCreate, stampUpdate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { LocationServiceModule } from '@/modules/location'

import { db } from '@/db'
import { locations, materialLocations, materials } from '@/db/schema'

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
      'MATERIAL_NOT_ASSIGNED_TO_LOCATION'
    ),
  alreadyAssigned: (materialId: number, locationId: number) =>
    new ConflictError(
      `Material ${materialId} is already assigned to location ${locationId}`,
      'MATERIAL_LOCATION_ALREADY_ASSIGNED'
    ),
}

export class MaterialLocationService {
  constructor(
    private readonly materialSvc: MaterialService,
    private readonly locationSvc: LocationServiceModule
  ) {}

  /* ─────────────────────── INTERNAL QUERIES ─────────────────────── */

  /** Get a specific material-location assignment */
  async findOne(materialId: number, locationId: number): Promise<MaterialLocationDto> {
    return record('MaterialLocationService.findOne', async () => {
      const [result] = await db
        .select()
        .from(materialLocations)
        .where(and(eq(materialLocations.materialId, materialId), eq(materialLocations.locationId, locationId)))

      if (!result) throw err.notAssigned(materialId, locationId)
      return {
        ...result,
        currentQty: Number(result.currentQty),
        currentAvgCost: Number(result.currentAvgCost),
        currentValue: Number(result.currentValue),
      }
    })
  }

  /** Get all assignments for a specific material */
  async findByMaterialId(materialId: number): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByMaterialId', async () => {
      const results = await db.select().from(materialLocations).where(eq(materialLocations.materialId, materialId))
      return results.map((r) => ({
        ...r,
        currentQty: Number(r.currentQty),
        currentAvgCost: Number(r.currentAvgCost),
        currentValue: Number(r.currentValue),
      }))
    })
  }

  /** Get all assignments for a specific location */
  async findByLocationId(locationId: number): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByLocationId', async () => {
      const results = await db.select().from(materialLocations).where(eq(materialLocations.locationId, locationId))
      return results.map((r) => ({
        ...r,
        currentQty: Number(r.currentQty),
        currentAvgCost: Number(r.currentAvgCost),
        currentValue: Number(r.currentValue),
      }))
    })
  }

  /* ──────────────────── HANDLER: ASSIGNMENTS ──────────────────── */

  /**
   * Assign multiple materials to a location (batch).
   * Skips any that are already assigned (upsert-like).
   */
  async handleAssign(data: MaterialLocationAssignDto, actorId: number): Promise<{ assignedCount: number }> {
    return record('MaterialLocationService.handleAssign', async () => {
      const { locationId, materialIds } = data

      // Validate location exists
      await this.locationSvc.location.findById(locationId)

      // Validate all materials exist
      for (const materialId of materialIds) {
        await this.materialSvc.findById(materialId)
      }

      // Find already assigned
      const existing = await db
        .select({ materialId: materialLocations.materialId })
        .from(materialLocations)
        .where(and(eq(materialLocations.locationId, locationId), inArray(materialLocations.materialId, materialIds)))

      const existingMaterialIds = new Set(existing.map((e) => e.materialId))
      const newMaterialIds = materialIds.filter((mId) => !existingMaterialIds.has(mId))

      if (newMaterialIds.length === 0) return { assignedCount: 0 }

      const metadata = stampCreate(actorId)

      const docs = newMaterialIds.map((materialId) => ({
        materialId,
        locationId,
        ...metadata,
      }))

      await db.insert(materialLocations).values(docs)

      return { assignedCount: newMaterialIds.length }
    })
  }

  /**
   * Unassign a material from a location.
   */
  async handleUnassign(data: MaterialLocationUnassignDto): Promise<{ id: number }> {
    return record('MaterialLocationService.handleUnassign', async () => {
      const { materialId, locationId } = data

      const [result] = await db
        .delete(materialLocations)
        .where(and(eq(materialLocations.materialId, materialId), eq(materialLocations.locationId, locationId)))
        .returning({ id: materialLocations.id })

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
      await this.materialSvc.findById(materialId)

      const assignments = await db
        .select({
          assignment: materialLocations,
          location: locations,
        })
        .from(materialLocations)
        .innerJoin(locations, eq(materialLocations.locationId, locations.id))
        .where(eq(materialLocations.materialId, materialId))

      return assignments.map((row) => ({
        ...row.assignment,
        currentQty: Number(row.assignment.currentQty),
        currentAvgCost: Number(row.assignment.currentAvgCost),
        currentValue: Number(row.assignment.currentValue),
        location: row.location,
      }))
    })
  }

  /* ──────────────── HANDLER: STOCK LIST PER LOCATION ──────────────── */

  /**
   * List materials at a specific location with stock data (paginated).
   * Joining with material data.
   */
  async handleStockByLocation(
    filter: MaterialLocationFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<MaterialLocationStockDto>> {
    return record('MaterialLocationService.handleStockByLocation', async () => {
      const { locationId, search } = filter

      // Validate location exists
      await this.locationSvc.location.findById(locationId)

      const searchCondition = search
        ? or(ilike(materials.name, `%${search}%`), ilike(materials.sku, `%${search}%`))
        : undefined

      const where = and(eq(materialLocations.locationId, locationId), searchCondition)

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: materialLocations.id,
              materialId: materialLocations.materialId,
              locationId: materialLocations.locationId,
              materialName: materials.name,
              materialSku: materials.sku,
              baseUom: materials.baseUom,
              minStock: materialLocations.minStock,
              maxStock: materialLocations.maxStock,
              reorderPoint: materialLocations.reorderPoint,
              currentQty: materialLocations.currentQty,
              currentAvgCost: materialLocations.currentAvgCost,
              currentValue: materialLocations.currentValue,
            })
            .from(materialLocations)
            .innerJoin(materials, eq(materialLocations.materialId, materials.id))
            .where(where)
            .orderBy(sortBy(materialLocations.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db
          .select({ count: count() })
          .from(materialLocations)
          .innerJoin(materials, eq(materialLocations.materialId, materials.id))
          .where(where),
      })

      // Convert numeric strings back to numbers for DTO compliance
      const data = result.data.map((stock) => ({
        ...stock,
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
        .update(materialLocations)
        .set({
          ...update,
          ...stampUpdate(actorId),
        })
        .where(eq(materialLocations.id, id))
        .returning({ id: materialLocations.id })

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
    actorId: number
  ): Promise<void> {
    return record('MaterialLocationService.updateCurrentStock', async () => {
      await db
        .update(materialLocations)
        .set({
          currentQty: stock.currentQty.toString(),
          currentAvgCost: stock.currentAvgCost.toString(),
          currentValue: stock.currentValue.toString(),
          ...stampUpdate(actorId),
        })
        .where(and(eq(materialLocations.materialId, materialId), eq(materialLocations.locationId, locationId)))
    })
  }
}

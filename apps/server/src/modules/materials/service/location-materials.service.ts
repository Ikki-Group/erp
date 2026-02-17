import { db } from '@server/database'
import { locationMaterials, locations, materials } from '@server/database/schema'
import { ConflictError, NotFoundError } from '@server/lib/error/http'
import {
  calculatePaginationMeta,
  type PaginationQuery,
  type WithPaginationResult,
} from '@server/lib/utils/pagination.util'
import type { SQL } from 'drizzle-orm'
import { and, count, eq, ilike, or } from 'drizzle-orm'

interface IFilter {
  search?: string
  isActive?: boolean
}

/**
 * Handles all location-material assignment-related business logic
 */
export class LocationMaterialsService {
  err = {
    NOT_FOUND: 'LOCATION_MATERIAL_NOT_FOUND',
    ASSIGNMENT_EXISTS: 'MATERIAL_ALREADY_ASSIGNED_TO_LOCATION',
  }

  /**
   * Lists all materials for a specific location with material details
   */
  async listByLocation(
    locationId: number,
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<
    WithPaginationResult<{
      id: number
      locationId: number
      materialId: number
      stockAlertThreshold: string | null
      weightedAvgCost: string | null
      isActive: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      material: { id: number; sku: string; name: string; type: 'raw' | 'semi'; baseUom: string } | null
    }>
  > {
    const { page, limit } = pq
    const { search, isActive } = filter

    const conditions = [eq(locationMaterials.locationId, locationId)]

    if (search) {
      const searchCondition = or(
        ilike(materials.sku, `%${search}%`),
        ilike(materials.name, `%${search}%`),
        ilike(materials.description, `%${search}%`)
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    if (isActive !== undefined) {
      conditions.push(eq(locationMaterials.isActive, isActive))
    }

    const whereClause = and(...conditions) as SQL<unknown>

    const [data, total] = await Promise.all([
      db
        .select({
          id: locationMaterials.id,
          locationId: locationMaterials.locationId,
          materialId: locationMaterials.materialId,
          stockAlertThreshold: locationMaterials.stockAlertThreshold,
          weightedAvgCost: locationMaterials.weightedAvgCost,
          isActive: locationMaterials.isActive,
          createdAt: locationMaterials.createdAt,
          createdBy: locationMaterials.createdBy,
          updatedAt: locationMaterials.updatedAt,
          updatedBy: locationMaterials.updatedBy,
          material: {
            id: materials.id,
            sku: materials.sku,
            name: materials.name,
            type: materials.type,
            baseUom: materials.baseUom,
          },
        })
        .from(locationMaterials)
        .leftJoin(materials, eq(locationMaterials.materialId, materials.id))
        .where(whereClause)
        .orderBy(locationMaterials.id)
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(locationMaterials)
        .leftJoin(materials, eq(locationMaterials.materialId, materials.id))
        .where(whereClause)
        .then((res) => res[0]?.total ?? 0),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Lists all locations for a specific material
   */
  async listByMaterial(materialId: number): Promise<
    {
      id: number
      locationId: number
      materialId: number
      stockAlertThreshold: string | null
      weightedAvgCost: string | null
      isActive: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      location: { id: number; code: string; name: string; type: 'store' | 'warehouse' | 'central_warehouse' } | null
    }[]
  > {
    const data = await db
      .select({
        id: locationMaterials.id,
        locationId: locationMaterials.locationId,
        materialId: locationMaterials.materialId,
        stockAlertThreshold: locationMaterials.stockAlertThreshold,
        weightedAvgCost: locationMaterials.weightedAvgCost,
        isActive: locationMaterials.isActive,
        createdAt: locationMaterials.createdAt,
        createdBy: locationMaterials.createdBy,
        updatedAt: locationMaterials.updatedAt,
        updatedBy: locationMaterials.updatedBy,
        location: {
          id: locations.id,
          code: locations.code,
          name: locations.name,
          type: locations.type,
        },
      })
      .from(locationMaterials)
      .leftJoin(locations, eq(locationMaterials.locationId, locations.id))
      .where(eq(locationMaterials.materialId, materialId))
      .orderBy(locationMaterials.id)

    return data
  }

  /**
   * Retrieves a location-material assignment by its ID
   */
  async getById(id: number): Promise<typeof locationMaterials.$inferSelect> {
    const [locationMaterial] = await db.select().from(locationMaterials).where(eq(locationMaterials.id, id)).limit(1)

    if (!locationMaterial) {
      throw new NotFoundError(`Location-material assignment with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return locationMaterial
  }

  /**
   * Bulk assigns materials to locations (for stores)
   */
  async bulkAssignToStores(
    materialIds: number[],
    locationIds: number[],
    createdBy = 1
  ): Promise<(typeof locationMaterials.$inferSelect)[]> {
    // Validate that all locations are stores
    const locationsData = await db
      .select()
      .from(locations)
      .where(or(...locationIds.map((id) => eq(locations.id, id))))

    const nonStoreLocations = locationsData.filter((loc) => loc.type !== 'store')
    if (nonStoreLocations.length > 0) {
      throw new ConflictError(
        'Bulk assignment is only allowed for store locations. Use auto-assignment for warehouses.',
        'INVALID_LOCATION_TYPE',
        {
          nonStoreLocationIds: nonStoreLocations.map((loc) => loc.id),
        }
      )
    }

    // Create assignments in a transaction
    const assignments = await db.transaction(async (tx) => {
      const assignmentValues = []

      for (const materialId of materialIds) {
        for (const locationId of locationIds) {
          // Check if assignment already exists
          const [existing] = await tx
            .select()
            .from(locationMaterials)
            .where(and(eq(locationMaterials.locationId, locationId), eq(locationMaterials.materialId, materialId)))
            .limit(1)

          if (!existing) {
            assignmentValues.push({
              locationId,
              materialId,
              stockAlertThreshold: '0',
              weightedAvgCost: '0',
              isActive: true,
              createdBy,
              updatedBy: createdBy,
            })
          }
        }
      }

      if (assignmentValues.length === 0) {
        return []
      }

      return tx.insert(locationMaterials).values(assignmentValues).returning()
    })

    return assignments
  }

  /**
   * Updates location-material configuration
   */
  async updateConfig(
    id: number,
    dto: { stockAlertThreshold?: string; weightedAvgCost?: string; isActive?: boolean },
    updatedBy = 1
  ): Promise<typeof locationMaterials.$inferSelect> {
    // Check if assignment exists
    await this.getById(id)

    // Update in a transaction
    const [updated] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof locationMaterials.$inferInsert> = {
        updatedBy,
      }

      if (dto.stockAlertThreshold !== undefined) updateData.stockAlertThreshold = dto.stockAlertThreshold
      if (dto.weightedAvgCost !== undefined) updateData.weightedAvgCost = dto.weightedAvgCost
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive

      return tx.update(locationMaterials).set(updateData).where(eq(locationMaterials.id, id)).returning()
    })

    return updated!
  }

  /**
   * Removes a location-material assignment
   */
  async removeAssignment(id: number): Promise<void> {
    const assignment = await this.getById(id)

    if (!assignment) {
      throw new NotFoundError(`Location-material assignment with ID ${id} not found`, this.err.NOT_FOUND)
    }

    await db.delete(locationMaterials).where(eq(locationMaterials.id, id))
  }
}

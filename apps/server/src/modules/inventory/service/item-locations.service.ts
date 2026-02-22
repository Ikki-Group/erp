import type { SQL } from 'drizzle-orm'
import { and, count, eq, ilike, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import { calculatePaginationMeta, type PaginationQuery, type WithPaginationResult } from '@/lib/utils/pagination.util'

import { db } from '@/database'
import { itemLocations, items, locations } from '@/database/schema'

interface IFilter {
  search?: string
  isAssigned?: boolean
}

/**
 * Handles all item-location assignment-related business logic
 */
export class ItemLocationsService {
  err = {
    NOT_FOUND: 'ITEM_LOCATION_NOT_FOUND',
    ASSIGNMENT_EXISTS: 'ITEM_ALREADY_ASSIGNED_TO_LOCATION',
  }

  /**
   * Lists all items for a specific location with item details
   */
  async listByLocation(
    locationId: number,
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<
    WithPaginationResult<{
      id: number
      locationId: number
      itemId: number
      isAssigned: boolean
      stockAlertLevel: number
      allowNegativeStock: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      item: { id: number; name: string; type: 'raw' | 'semi'; baseUnit: string } | null
    }>
  > {
    const { page, limit } = pq
    const { search, isAssigned } = filter

    const conditions = [eq(itemLocations.locationId, locationId)]

    if (search) {
      const searchCondition = or(ilike(items.name, `%${search}%`), ilike(items.description, `%${search}%`))
      if (searchCondition) conditions.push(searchCondition)
    }

    if (isAssigned !== undefined) {
      conditions.push(eq(itemLocations.isAssigned, isAssigned))
    }

    const whereClause = and(...conditions) as SQL<unknown>

    const [data, total] = await Promise.all([
      db
        .select({
          id: itemLocations.id,
          locationId: itemLocations.locationId,
          itemId: itemLocations.itemId,
          isAssigned: itemLocations.isAssigned,
          stockAlertLevel: itemLocations.stockAlertLevel,
          allowNegativeStock: itemLocations.allowNegativeStock,
          createdAt: itemLocations.createdAt,
          createdBy: itemLocations.createdBy,
          updatedAt: itemLocations.updatedAt,
          updatedBy: itemLocations.updatedBy,
          item: {
            id: items.id,
            name: items.name,
            type: items.type,
            baseUnit: items.baseUnit,
          },
        })
        .from(itemLocations)
        .leftJoin(items, eq(itemLocations.itemId, items.id))
        .where(whereClause)
        .orderBy(itemLocations.id)
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(itemLocations)
        .leftJoin(items, eq(itemLocations.itemId, items.id))
        .where(whereClause)
        .then((res) => res[0]?.total ?? 0),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Lists all locations for a specific item
   */
  async listByItem(itemId: number): Promise<
    {
      id: number
      locationId: number
      itemId: number
      isAssigned: boolean
      stockAlertLevel: number
      allowNegativeStock: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      location: { id: number; code: string; name: string; type: 'store' | 'warehouse' } | null
    }[]
  > {
    const data = await db
      .select({
        id: itemLocations.id,
        locationId: itemLocations.locationId,
        itemId: itemLocations.itemId,
        isAssigned: itemLocations.isAssigned,
        stockAlertLevel: itemLocations.stockAlertLevel,
        allowNegativeStock: itemLocations.allowNegativeStock,
        createdAt: itemLocations.createdAt,
        createdBy: itemLocations.createdBy,
        updatedAt: itemLocations.updatedAt,
        updatedBy: itemLocations.updatedBy,
        location: {
          id: locations.id,
          code: locations.code,
          name: locations.name,
          type: locations.type,
        },
      })
      .from(itemLocations)
      .leftJoin(locations, eq(itemLocations.locationId, locations.id))
      .where(eq(itemLocations.itemId, itemId))
      .orderBy(itemLocations.id)

    return data
  }

  /**
   * Retrieves an item-location assignment by its ID
   */
  async getById(id: number): Promise<typeof itemLocations.$inferSelect> {
    const [itemLocation] = await db.select().from(itemLocations).where(eq(itemLocations.id, id)).limit(1)

    if (!itemLocation) {
      throw new NotFoundError(`Item-location assignment with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return itemLocation
  }

  /**
   * Bulk assigns items to locations (for stores)
   */
  async bulkAssignToStores(
    itemIds: number[],
    locationIds: number[],
    createdBy = 1
  ): Promise<(typeof itemLocations.$inferSelect)[]> {
    // Validate that all locations are stores
    const locationsData = await db
      .select()
      .from(locations)
      .where(or(...locationIds.map((id) => eq(locations.id, id))))

    const nonStoreLocations = locationsData.filter((loc) => loc.type !== 'store')
    if (nonStoreLocations.length > 0) {
      throw new ConflictError('Bulk assignment is only meaningful for store locations.', 'INVALID_LOCATION_TYPE', {
        nonStoreLocationIds: nonStoreLocations.map((loc) => loc.id),
      })
    }

    // Create assignments in a transaction
    const assignments = await db.transaction(async (tx) => {
      const assignmentValues = []

      for (const itemId of itemIds) {
        for (const locationId of locationIds) {
          // Check if assignment already exists
          const [existing] = await tx
            .select()
            .from(itemLocations)
            .where(and(eq(itemLocations.locationId, locationId), eq(itemLocations.itemId, itemId)))
            .limit(1)

          if (existing) {
            // activate assignment
            if (!existing.isAssigned) {
              await tx
                .update(itemLocations)
                .set({ isAssigned: true, updatedBy: createdBy })
                .where(eq(itemLocations.id, existing.id))
              assignmentValues.push({ ...existing, isAssigned: true })
            }
          }
        }
      }

      return assignmentValues
    })

    return assignments
  }

  /**
   * Updates item-location configuration
   */
  async updateConfig(
    id: number,
    dto: { isAssigned?: boolean; stockAlertLevel?: number; allowNegativeStock?: boolean },
    updatedBy = 1
  ): Promise<typeof itemLocations.$inferSelect> {
    // Check if assignment exists
    await this.getById(id)

    // Update in a transaction
    const [updated] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof itemLocations.$inferInsert> = {
        updatedBy,
      }

      if (dto.stockAlertLevel !== undefined) updateData.stockAlertLevel = dto.stockAlertLevel
      if (dto.isAssigned !== undefined) updateData.isAssigned = dto.isAssigned
      if (dto.allowNegativeStock !== undefined) updateData.allowNegativeStock = dto.allowNegativeStock

      return tx.update(itemLocations).set(updateData).where(eq(itemLocations.id, id)).returning()
    })

    return updated!
  }

  /**
   * Removes an item-location assignment
   */
  async removeAssignment(id: number): Promise<void> {
    const assignment = await this.getById(id)

    if (!assignment) {
      throw new NotFoundError(`Item-location assignment with ID ${id} not found`, this.err.NOT_FOUND)
    }

    await db.delete(itemLocations).where(eq(itemLocations.id, id))
  }
}

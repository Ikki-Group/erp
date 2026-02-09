import { and, count, eq, ilike, ne, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@server/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@server/lib/utils/pagination.util'
import { locations } from '@server/database/schema'
import { db } from '@server/database'

interface IFilter {
  search?: string
  type?: 'store' | 'warehouse' | 'central_warehouse'
  isActive?: boolean
}

/**
 * Handles all location-related business logic including CRUD operations
 */
export class LocationsService {
  err = {
    NOT_FOUND: 'LOCATION_NOT_FOUND',
    CODE_EXISTS: 'LOCATION_CODE_EXISTS',
  }

  /**
   * Builds a dynamic query with filters
   */
  private buildFilteredQuery(filter: IFilter) {
    const { search, type, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(locations.code, `%${search}%`), ilike(locations.name, `%${search}%`)))
    }

    if (type) {
      conditions.push(eq(locations.type, type))
    }

    if (isActive !== undefined) {
      conditions.push(eq(locations.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(locations).where(whereClause).$dynamic()
  }

  /**
   * Counts total locations matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, type, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(or(ilike(locations.code, `%${search}%`), ilike(locations.name, `%${search}%`)))
    }

    if (type) {
      conditions.push(eq(locations.type, type))
    }

    if (isActive !== undefined) {
      conditions.push(eq(locations.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(locations).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists locations with pagination
   */
  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<typeof locations.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(locations.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a location by its ID
   */
  async getById(id: number) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1)

    if (!location) {
      throw new NotFoundError(`Location with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return location
  }

  /**
   * Creates a new location with validation
   */
  async create(
    dto: {
      code: string
      name: string
      type: 'store' | 'warehouse' | 'central_warehouse'
      description?: string | null
    },
    createdBy = 1
  ) {
    // Check for existing code
    const [existing] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.code, dto.code))
      .limit(1)

    if (existing) {
      throw new ConflictError('Location with this code already exists', this.err.CODE_EXISTS, {
        code: dto.code,
      })
    }

    const [location] = await db.transaction(async (tx) => {
      return tx
        .insert(locations)
        .values({
          code: dto.code.toUpperCase().trim(),
          name: dto.name.trim(),
          type: dto.type,
          description: dto.description?.trim() ?? null,
          isActive: true,
          createdBy,
          updatedBy: createdBy,
        })
        .returning()
    })

    return location!
  }

  /**
   * Updates an existing location
   */
  async update(
    id: number,
    dto: {
      code?: string
      name?: string
      type?: 'store' | 'warehouse' | 'central_warehouse'
      description?: string | null
      isActive?: boolean
    },
    updatedBy = 1
  ) {
    const location = await this.getById(id)

    if (dto.code && dto.code !== location.code) {
      const [existing] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(ne(locations.id, id), eq(locations.code, dto.code)))
        .limit(1)

      if (existing) {
        throw new ConflictError('Location code already in use', this.err.CODE_EXISTS, { code: dto.code })
      }
    }

    const [updatedLocation] = await db.transaction(async (tx) => {
      return tx
        .update(locations)
        .set({
          code: dto.code?.toUpperCase().trim(),
          name: dto.name?.trim(),
          type: dto.type,
          description: dto.description?.trim(),
          isActive: dto.isActive,
          updatedBy,
        })
        .where(eq(locations.id, id))
        .returning()
    })

    return updatedLocation!
  }

  /**
   * Deletes a location permanently
   */
  async delete(id: number) {
    await this.getById(id)
    await db.delete(locations).where(eq(locations.id, id))
  }

  /**
   * Toggles location active status
   */
  async toggleActive(id: number, updatedBy = 1) {
    const location = await this.getById(id)

    const [updatedLocation] = await db
      .update(locations)
      .set({
        isActive: !location.isActive,
        updatedBy,
      })
      .where(eq(locations.id, id))
      .returning()

    return updatedLocation!
  }
}

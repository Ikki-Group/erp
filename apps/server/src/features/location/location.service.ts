import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

import { locations } from '@/database/schema'
import { db } from '@/database'
import { ConflictError, NotFoundError } from '@/shared/errors/http.error'
import { calculatePaginationMeta } from '@/shared/utils/pagination.util'

import type { LocationDto } from './location.dto'

export class LocationService {
  /**
   * Get all locations with pagination and filters
   */
  async getLocations(query: LocationDto.LocationQuery) {
    const { page = 1, limit = 10, search, type, isActive } = query
    const offset = (page - 1) * limit

    const where = and(
      search
        ? or(
            ilike(locations.code, `%${search}%`),
            ilike(locations.name, `%${search}%`),
            ilike(locations.city, `%${search}%`),
            ilike(locations.province, `%${search}%`)
          )
        : undefined,
      type ? eq(locations.type, type) : undefined,
      isActive === undefined ? undefined : eq(locations.isActive, isActive)
    )

    const [totalResult] = await db.select({ value: count() }).from(locations).where(where)
    const total = Number(totalResult?.value ?? 0)

    const data = await db
      .select()
      .from(locations)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(locations.createdAt))

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1)

    if (!location) throw new NotFoundError('Location not found')
    return location
  }

  /**
   * Create new location
   */
  async createLocation(data: LocationDto.LocationCreate) {
    try {
      const [location] = await db
        .insert(locations)
        .values({
          code: data.code,
          name: data.name,
          type: data.type,
          address: data.address ?? '',
          city: data.city ?? '',
          province: data.province ?? '',
          postalCode: data.postalCode ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
        })
        .returning()

      if (!location) throw new Error('Failed to create location')
      return location
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new ConflictError('Location code already exists')
      }
      throw error
    }
  }

  /**
   * Update location by ID
   */
  async updateLocation(id: string, data: LocationDto.LocationUpdate) {
    const [location] = await db.update(locations).set(data).where(eq(locations.id, id)).returning()

    if (!location) throw new NotFoundError('Location not found')
    return location
  }

  /**
   * Delete location (soft delete by setting isActive = false)
   */
  async deleteLocation(id: string) {
    const [location] = await db.update(locations).set({ isActive: false }).where(eq(locations.id, id)).returning()

    if (!location) throw new NotFoundError('Location not found')
    return location
  }
}

export const locationService = new LocationService()

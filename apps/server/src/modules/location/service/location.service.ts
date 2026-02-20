import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/utils/pagination.util'

import { db } from '@/database'
import { locations } from '@/database/schema'

import type { LocationDto, LocationMutationDto, LocationType } from '../dto'

/* ---------------------------------- TYPES --------------------------------- */

interface LocationFilter {
  search?: string
  type?: LocationType
  isActive?: boolean
}

/* -------------------------------- CONSTANT -------------------------------- */
const err = {
  idNotFound: (id: number) => new NotFoundError(`Location ID ${id} not found`),
  codeExist: (code: string) =>
    new ConflictError(`Location code ${code} already exists`, 'LOCATION_CODE_ALREADY_EXISTS'),
  nameExist: (name: string) =>
    new ConflictError(`Location name ${name} already exists`, 'LOCATION_NAME_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class LocationService {
  protected buildWhereClause(filter: LocationFilter) {
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

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async checkConflict(input: { code?: string; name?: string }, excludeId?: number): Promise<void> {
    const { code, name } = input

    const conditions = []
    if (code) conditions.push(eq(locations.code, code))
    if (name) conditions.push(eq(locations.name, name))

    if (conditions.length === 0) return

    const whereClause = excludeId ? and(or(...conditions), not(eq(locations.id, excludeId))) : or(...conditions)

    const existing = await db
      .select({ id: locations.id, code: locations.code, name: locations.name })
      .from(locations)
      .where(whereClause)
      .limit(2)

    if (existing.length === 0) return
    const codeConflict = code && existing.some((r) => r.code === code)
    const nameConflict = name && existing.some((r) => r.name === name)

    if (codeConflict) throw err.codeExist(code)
    if (nameConflict) throw err.nameExist(name)
  }

  async find(filter: LocationFilter): Promise<LocationDto[]> {
    const whereClause = this.buildWhereClause(filter)
    return db.select().from(locations).where(whereClause).execute()
  }

  async count(filter: LocationFilter): Promise<number> {
    const whereClause = this.buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(locations).where(whereClause)
    return result?.total || 0
  }

  async listPaginated(filter: LocationFilter, pq: PaginationQuery): Promise<WithPaginationResult<LocationDto>> {
    const { page, limit } = pq

    const whereClause = this.buildWhereClause(filter)
    const [data, total] = await Promise.all([
      withPagination(db.select().from(locations).where(whereClause).orderBy(locations.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(id: number) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1)
    if (!location) throw err.idNotFound(id)
    return location
  }

  async create(input: LocationMutationDto, createdBy = 1) {
    await this.checkConflict(input)

    const [location] = await db
      .insert(locations)
      .values({
        ...input,
        isActive: input.isActive ?? true,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    return location!
  }

  async update(id: number, input: LocationMutationDto, updatedBy = 1) {
    await this.checkConflict({ code: input.code, name: input.name }, id)

    const [updatedLocation] = await db
      .update(locations)
      .set({
        ...input,
        updatedBy,
      })
      .where(eq(locations.id, id))
      .returning()

    if (!updatedLocation) throw err.idNotFound(id)
    return updatedLocation
  }
}

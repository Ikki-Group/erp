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

import type { LocationSchema, LocationType } from '../location.schema'

/* ---------------------------------- TYPES --------------------------------- */

interface IFilter {
  search?: string
  type?: LocationType
  isActive?: boolean
}

/* -------------------------------- CONSTANT -------------------------------- */
const err = {
  idNotFound: (id: number) => new NotFoundError(`Location id ${id} not found`),
  codeExist: (code: string) => new ConflictError(`Location code ${code} exist`, 'LOCATION_CODE_ALREADY_EXISTS'),
  nameExist: (name: string) => new ConflictError(`Location name ${name} exist`),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class LocationService {
  buildWhereClause(filter: IFilter) {
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

  async checkConflict(input: { code: string; name: string }, excludeId?: number): Promise<void> {
    const conditions = [eq(locations.code, input.code), eq(locations.name, input.name)]
    const whereClause = excludeId ? and(or(...conditions), not(eq(locations.id, excludeId))) : or(...conditions)

    const existing = await db
      .select({ id: locations.id, code: locations.code, name: locations.name })
      .from(locations)
      .where(whereClause)
      .limit(2)

    if (existing.length === 0) return

    const codeExists = existing.some((r) => r.code === input.code)
    const nameExists = existing.some((r) => r.name === input.name)

    if (codeExists) throw err.codeExist(input.code)
    if (nameExists) throw err.nameExist(input.name)
  }

  async find(filter: IFilter): Promise<LocationSchema[]> {
    const whereClause = this.buildWhereClause(filter)
    return db.select().from(locations).where(whereClause).execute()
  }

  async count(filter: IFilter): Promise<number> {
    const whereClause = this.buildWhereClause(filter)
    const [result] = await db.select({ total: count() }).from(locations).where(whereClause)
    return result?.total || 0
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<LocationSchema>> {
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

  async create(input: Pick<LocationSchema, 'code' | 'name' | 'type' | 'description' | 'isActive'>, createdBy = 1) {
    this.checkConflict(input)

    const [location] = await db
      .insert(locations)
      .values({
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        type: input.type,
        description: input.description?.trim() ?? null,
        isActive: input.isActive ?? true,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    return location!
  }

  async update(
    id: number,
    input: Pick<LocationSchema, 'code' | 'name' | 'type' | 'description' | 'isActive'>,
    updatedBy = 1
  ) {
    await this.checkConflict(input, id)

    const [updatedLocation] = await db
      .update(locations)
      .set({
        code: input.code?.toUpperCase().trim(),
        name: input.name?.trim(),
        type: input.type,
        description: input.description?.trim(),
        isActive: input.isActive,
        updatedBy,
      })
      .where(eq(locations.id, id))
      .returning()

    return updatedLocation!
  }
}

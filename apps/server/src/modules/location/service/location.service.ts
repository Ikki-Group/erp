import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { locations } from '@/database/schema'

import type { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from '../dto'

const err = {
  idNotFound: (id: number) => new NotFoundError(`Location ID ${id} not found`),
  codeExist: (code: string) =>
    new ConflictError(`Location code ${code} already exists`, 'LOCATION_CODE_ALREADY_EXISTS'),
  nameExist: (name: string) =>
    new ConflictError(`Location name ${name} already exists`, 'LOCATION_NAME_ALREADY_EXISTS'),
}

export class LocationService {
  #buildWhere(filter: LocationFilterDto) {
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

  async #checkConflict(input: Pick<LocationCreateDto, 'code' | 'name'>, selected?: LocationDto): Promise<void> {
    const { code, name } = input

    const conditions = []
    if (code !== selected?.code) conditions.push(eq(locations.code, code))
    if (name !== selected?.name) conditions.push(eq(locations.name, name))

    if (conditions.length === 0) return

    const whereClause = selected ? and(or(...conditions), not(eq(locations.id, selected.id))) : or(...conditions)

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

  async find(filter: LocationFilterDto): Promise<LocationDto[]> {
    const whereClause = this.#buildWhere(filter)
    return db.select().from(locations).where(whereClause).execute()
  }

  async count(filter: LocationFilterDto): Promise<number> {
    const whereClause = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(locations).where(whereClause)
    return result?.total || 0
  }

  async listPaginated(filter: LocationFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<LocationDto>> {
    const whereClause = this.#buildWhere(filter)
    const [data, total] = await Promise.all([
      withPagination(db.select().from(locations).where(whereClause).orderBy(locations.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async getById(id: number): Promise<LocationDto> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1)
    if (!location) throw err.idNotFound(id)
    return location
  }

  async create(input: LocationCreateDto, createdBy = 1): Promise<LocationDto> {
    await this.#checkConflict(input)

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

  async update(id: number, input: LocationUpdateDto, updatedBy = 1): Promise<LocationDto> {
    const selected = await this.getById(id)
    await this.#checkConflict({ code: input.code, name: input.name }, selected)

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

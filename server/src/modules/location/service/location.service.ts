import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'

import { cache } from '@/core/cache'
import {
  checkConflict,
  paginate,
  searchFilter,
  sortBy,
  stampCreate,
  stampUpdate,
  takeFirstOrThrow,
  type ConflictField,
} from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { locationsTable } from '@/db/schema'

import { db } from '@/db'

import type { LocationDto, LocationFilterDto, LocationMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
}

const uniqueFields: ConflictField<'code' | 'name'>[] = [
  {
    field: 'code',
    column: locationsTable.code,
    message: 'Location code already exists',
    code: 'LOCATION_CODE_ALREADY_EXISTS',
  },
  {
    field: 'name',
    column: locationsTable.name,
    message: 'Location name already exists',
    code: 'LOCATION_NAME_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'location.count',
  list: 'location.list',
  byId: (id: number) => `location.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class LocationService {
  /**
   * Seed initial locations into the database.
   * Uses upsert pattern based on location code.
   */
  async seed(data: Pick<LocationDto, 'code' | 'name' | 'type' | 'createdBy'>[]): Promise<void> {
    return record('LocationService.seed', async () => {
      for (const d of data) {
        const metadata = stampCreate(d.createdBy)
        await db
          .insert(locationsTable)
          .values({
            ...d,
            description: '',
            isActive: true,
            ...metadata,
          })
          .onConflictDoUpdate({
            target: locationsTable.code,
            set: {
              name: d.name,
              type: d.type,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
            },
          })
      }
    })
  }

  /**
   * Returns all active locations, cached.
   */
  async find(): Promise<LocationDto[]> {
    return record('LocationService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(locationsTable).where(eq(locationsTable.isActive, true)).orderBy(locationsTable.name)
      })
    })
  }

  /**
   * Finds a single location by ID. Throws if not found.
   */
  async findById(id: number): Promise<LocationDto> {
    return record('LocationService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(locationsTable).where(eq(locationsTable.id, id))
        return takeFirstOrThrow(result, `Location with ID ${id} not found`, 'LOCATION_NOT_FOUND')
      })
    })
  }

  /**
   * Returns total count of locations, cached.
   */
  async count(): Promise<number> {
    return record('LocationService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(locationsTable)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches a paginated list of locations with optional filters.
   */
  async handleList(filter: LocationFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<LocationDto>> {
    return record('LocationService.handleList', async () => {
      const { search, type, isActive } = filter

      const where = and(
        searchFilter(locationsTable.name, search),
        type ? eq(locationsTable.type, type) : undefined,
        typeof isActive === 'boolean' ? eq(locationsTable.isActive, isActive) : undefined
      )

      return paginate<LocationDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(locationsTable)
            .where(where)
            .orderBy(sortBy(locationsTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(locationsTable).where(where),
      })
    })
  }

  /**
   * Serves location details for a single ID.
   */
  async handleDetail(id: number): Promise<LocationDto> {
    return record('LocationService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  /**
   * Creates a new location. Invalidates cache.
   */
  async handleCreate(data: LocationMutationDto, actorId: number): Promise<{ id: number }> {
    return record('LocationService.handleCreate', async () => {
      await checkConflict({
        table: locationsTable,
        pkColumn: locationsTable.id,
        fields: uniqueFields,
        input: data,
      })

      const [inserted] = await db
        .insert(locationsTable)
        .values({
          ...data,
          ...stampCreate(actorId),
        })
        .returning({ id: locationsTable.id })

      if (!inserted) throw new Error('Failed to create location')

      void this.clearCache()
      return inserted
    })
  }

  /**
   * Updates an existing location. Invalidates cache.
   */
  async handleUpdate(id: number, data: LocationMutationDto, actorId: number): Promise<{ id: number }> {
    return record('LocationService.handleUpdate', async () => {
      const existing = await this.findById(id)

      await checkConflict({
        table: locationsTable,
        pkColumn: locationsTable.id,
        fields: uniqueFields,
        input: data,
        existing,
      })

      await db
        .update(locationsTable)
        .set({
          ...data,
          ...stampUpdate(actorId),
        })
        .where(eq(locationsTable.id, id))

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes a location. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('LocationService.handleRemove', async () => {
      const result = await db.delete(locationsTable).where(eq(locationsTable.id, id)).returning({ id: locationsTable.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Utility to clear location caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}


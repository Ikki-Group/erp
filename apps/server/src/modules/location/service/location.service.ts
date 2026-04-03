import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'
import { z } from 'zod'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import { db } from '@/db'
import { locationsTable } from '@/db/schema'

import type * as dto from '../dto/location.dto'

const err = {
  notFound: (id: string) => new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
}

const uniqueFields: core.ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: locationsTable.code, message: 'Location code exists', code: 'LOCATION_CODE_EXISTS' },
  { field: 'name', column: locationsTable.name, message: 'Location name exists', code: 'LOCATION_NAME_EXISTS' },
]

const cacheKey = {
  count: 'location.count',
  list: 'location.list',
  byId: (id: string) => `location.byId.${id}`,
}

/**
 * Location Service (Layer 0)
 * Handles physical and virtual location management.
 */
export class LocationService {
  /**
   * Seed initial locations into the database.
   *
   * @param {any[]} data - The location data to seed.
   * @returns {Promise<void>} completion.
   */
  async seed(data: (z.infer<typeof dto.zCreateLocationDto> & { createdBy: string })[]): Promise<void> {
    await record('LocationService.seed', async () => {
      for (const d of data) {
        const metadata = core.stampCreate(d.createdBy)
        await db
          .insert(locationsTable)
          .values({ ...d, ...metadata })
          .onConflictDoUpdate({
            target: locationsTable.code,
            set: {
              name: d.name,
              type: d.type,
              classification: d.classification,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
              deletedAt: null,
            },
          })
      }
      await this.clearCache()
    })
  }

  /**
   * Returns active locations.
   *
   * @returns {Promise<any[]>} locations.
   */
  async find(): Promise<z.infer<typeof dto.zLocationDto>[]> {
    const result = await record('LocationService.find', async () => {
      const data = await cache.wrap(cacheKey.list, async () => {
        const rows = await db.select().from(locationsTable).where(isNull(locationsTable.deletedAt)).orderBy(locationsTable.name)
        return rows as unknown as z.infer<typeof dto.zLocationDto>[]
      })
      return data
    })
    return result
  }

  /**
   * Finds a location by ID.
   *
   * @param {string} id - UUID.
   * @returns {Promise<any>} location.
   */
  async getById(id: string): Promise<z.infer<typeof dto.zLocationDto>> {
    const result = await record('LocationService.getById', async () => {
      const data = await cache.wrap(cacheKey.byId(id), async () => {
        const rows = await db.select().from(locationsTable).where(and(eq(locationsTable.id, id), isNull(locationsTable.deletedAt)))
        const first = core.takeFirstOrThrow(rows, `Location with ID ${id} not found`, 'LOCATION_NOT_FOUND')
        return first as unknown as z.infer<typeof dto.zLocationDto>
      })
      return data
    })
    return result
  }

  /**
   * Returns total count.
   *
   * @returns {Promise<number>} count.
   */
  async count(): Promise<number> {
    const result = await record('LocationService.count', async () => {
      const data = await cache.wrap(cacheKey.count, async () => {
        const rows = await db.select({ val: count() }).from(locationsTable).where(isNull(locationsTable.deletedAt))
        return rows[0]?.val ?? 0
      })
      return data
    })
    return result
  }

  /**
   * Paginated list.
   *
   * @param {any} filter - query.
   * @returns {Promise<any>} result.
   */
  async handleList(filter: z.infer<typeof dto.zFilterLocationDto>): Promise<core.WithPaginationResult<z.infer<typeof dto.zLocationDto>>> {
    const result = await record('LocationService.handleList', async () => {
      const { q, page, limit, type } = filter
      const where = and(
        isNull(locationsTable.deletedAt),
        q === undefined ? undefined : or(core.searchFilter(locationsTable.name, q), core.searchFilter(locationsTable.code, q)),
        type === undefined ? undefined : eq(locationsTable.type, type),
      )

      const p = await core.paginate<z.infer<typeof dto.zLocationDto>>({
        data: async ({ limit: l, offset }) => {
          const rows = await db.select().from(locationsTable).where(where).orderBy(core.sortBy(locationsTable.updatedAt, 'desc')).limit(l).offset(offset)
          return rows as unknown as z.infer<typeof dto.zLocationDto>[]
        },
        pq: { page, limit },
        countQuery: db.select({ count: count() }).from(locationsTable).where(where),
      })
      return p
    })
    return result
  }

  /**
   * Resource detail.
   *
   * @param {string} id - UUID.
   * @returns {Promise<any>} detail.
   */
  async handleDetail(id: string): Promise<z.infer<typeof dto.zLocationDto>> {
    const result = await record('LocationService.handleDetail', async () => {
      const detail = await this.getById(id)
      return detail
    })
    return result
  }

  /**
   * Creation.
   *
   * @param {any} data - payload.
   * @param {string} actorId - user.
   * @returns {Promise<any>} id.
   */
  async handleCreate(data: z.infer<typeof dto.zCreateLocationDto>, actorId: string): Promise<{ id: string }> {
    const result = await record('LocationService.handleCreate', async () => {
      await core.checkConflict({ table: locationsTable, pkColumn: locationsTable.id, fields: uniqueFields, input: data })
      const [inserted] = await db.insert(locationsTable).values({ ...data, ...core.stampCreate(actorId) }).returning({ id: locationsTable.id })
      if (!inserted) throw new Error('Create failed')
      await this.clearCache()
      return inserted
    })
    return result
  }

  /**
   * Update.
   *
   * @param {string} id - UUID.
   * @param {any} data - payload.
   * @param {string} actorId - user.
   * @returns {Promise<any>} id.
   */
  async handleUpdate(id: string, data: z.infer<typeof dto.zUpdateLocationDto>, actorId: string): Promise<{ id: string }> {
    const result = await record('LocationService.handleUpdate', async () => {
      const existing = await this.getById(id)
      await core.checkConflict({ table: locationsTable, pkColumn: locationsTable.id, fields: uniqueFields, input: data as any, existing })
      await db.update(locationsTable).set({ ...data, ...core.stampUpdate(actorId) }).where(eq(locationsTable.id, id))
      await this.clearCache(id)
      return { id }
    })
    return result
  }

  /**
   * Soft Remove.
   *
   * @param {string} id - UUID.
   * @param {string} actorId - user.
   * @returns {Promise<any>} id.
   */
  async handleRemove(id: string, actorId: string): Promise<{ id: string }> {
    const result = await record('LocationService.handleRemove', async () => {
      const rows = await db.update(locationsTable).set({ deletedAt: new Date(), deletedBy: actorId }).where(eq(locationsTable.id, id)).returning({ id: locationsTable.id })
      const first = rows[0]
      if (!first) throw err.notFound(id)
      await this.clearCache(id)
      return first
    })
    return result
  }

  /**
   * Hard Remove.
   *
   * @param {string} id - UUID.
   * @returns {Promise<any>} id.
   */
  async handleHardRemove(id: string): Promise<{ id: string }> {
    const result = await record('LocationService.handleHardRemove', async () => {
      const rows = await db.delete(locationsTable).where(eq(locationsTable.id, id)).returning({ id: locationsTable.id })
      const first = rows[0]
      if (!first) throw err.notFound(id)
      await this.clearCache(id)
      return first
    })
    return result
  }

  /**
   * Clear cache.
   *
   * @param {string} id - optional.
   * @returns {Promise<void>} void.
   */
  private async clearCache(id?: string): Promise<void> {
    await Promise.all([cache.del(cacheKey.count), cache.del(cacheKey.list), id === undefined ? Promise.resolve() : cache.del(cacheKey.byId(id))])
  }
}

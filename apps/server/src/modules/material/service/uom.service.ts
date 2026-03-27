import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

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
import { db } from '@/db'
import { uomsTable } from '@/db/schema'

import type { UomDto, UomFilterDto, UomMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = { notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`) }

const uniqueFields: ConflictField<'code'>[] = [
  { field: 'code', column: uomsTable.code, message: 'UOM code already exists', code: 'UOM_CODE_ALREADY_EXISTS' },
]

const cacheKey = { count: 'uom.count', list: 'uom.list', byId: (id: number) => `uom.byId.${id}` }

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UomService {
  /**
   * Returns all UOMs, cached.
   */
  async find(): Promise<UomDto[]> {
    return record('UomService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(uomsTable).orderBy(uomsTable.code)
      })
    })
  }

  /**
   * Finds a single UOM by ID. Throws if not found.
   */
  async getById(id: number): Promise<UomDto> {
    return record('UomService.getById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(uomsTable).where(eq(uomsTable.id, id))
        return takeFirstOrThrow(result, `UOM with ID ${id} not found`)
      })
    })
  }

  /**
   * Returns total count of UOMs, cached.
   */
  async count(): Promise<number> {
    return record('UomService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(uomsTable)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of UOMs.
   */
  async handleList(filter: UomFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UomDto>> {
    return record('UomService.handleList', async () => {
      const { search } = filter
      const where = searchFilter(uomsTable.code, search)

      return paginate<UomDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(uomsTable)
            .where(where)
            .orderBy(sortBy(uomsTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(uomsTable).where(where),
      })
    })
  }

  /**
   * Serves UOM detail.
   */
  async handleDetail(id: number): Promise<UomDto> {
    return record('UomService.handleDetail', async () => {
      return this.getById(id)
    })
  }

  /**
   * Creates a new UOM. Invalidates cache.
   */
  async handleCreate(data: UomMutationDto, actorId: number): Promise<{ id: number }> {
    return record('UomService.handleCreate', async () => {
      const code = data.code.toUpperCase().trim()

      await checkConflict({ table: uomsTable, pkColumn: uomsTable.id, fields: uniqueFields, input: { code } })

      const [inserted] = await db
        .insert(uomsTable)
        .values({ code, ...stampCreate(actorId) })
        .returning({ id: uomsTable.id })

      if (!inserted) throw new Error('Failed to create UOM')

      await this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing UOM. Invalidates cache.
   */
  async handleUpdate(id: number, data: Partial<UomMutationDto>, actorId: number): Promise<{ id: number }> {
    return record('UomService.handleUpdate', async () => {
      const existing = await this.getById(id)

      const code = data.code ? data.code.toUpperCase().trim() : existing.code

      await checkConflict({ table: uomsTable, pkColumn: uomsTable.id, fields: uniqueFields, input: { code }, existing })

      await db
        .update(uomsTable)
        .set({ code, ...stampUpdate(actorId) })
        .where(eq(uomsTable.id, id))

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes UOM. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('UomService.handleRemove', async () => {
      const result = await db.delete(uomsTable).where(eq(uomsTable.id, id)).returning({ id: uomsTable.id })
      if (result.length === 0) throw err.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant UOM caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }

  /**
   * Seed UOMs by skipping already existing ones.
   */
  async seed(data: { code: string; createdBy: number }[]): Promise<void> {
    return record('UomService.seed', async () => {
      const existing = await db.select({ code: uomsTable.code }).from(uomsTable)
      const existingCodes = new Set(existing.map((e) => e.code))

      const newUoms = data
        .map((d) => ({ ...d, code: d.code.toUpperCase().trim() }))
        .filter((d) => !existingCodes.has(d.code))

      if (newUoms.length === 0) return

      await db.insert(uomsTable).values(newUoms.map((d) => Object.assign({}, d, stampCreate(d.createdBy))))

      await this.clearCache()
    })
  }
}

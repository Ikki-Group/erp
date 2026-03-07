import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { cache } from '@/lib/cache'
import {
  checkConflict,
  paginate,
  searchFilter,
  sortBy,
  stampCreate,
  stampUpdate,
  takeFirstOrThrow,
  type ConflictField,
} from '@/lib/db'
import { NotFoundError } from '@/lib/error/http'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import { salesTypes } from '@/db/schema'

import { db } from '@/db'

import type { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND'),
}

const uniqueFields: ConflictField<'code'>[] = [
  {
    field: 'code',
    column: salesTypes.code,
    message: 'Sales type code already exists',
    code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'salesType.count',
  list: 'salesType.list',
  byId: (id: number) => `salesType.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class SalesTypeService {
  /**
   * Returns all sales types, cached.
   */
  async find(): Promise<SalesTypeDto[]> {
    return record('SalesTypeService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(salesTypes).orderBy(salesTypes.name)
      })
    })
  }

  /**
   * Finds a single sales type by ID. Throws if not found.
   */
  async findById(id: number): Promise<SalesTypeDto> {
    return record('SalesTypeService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(salesTypes).where(eq(salesTypes.id, id))
        return takeFirstOrThrow(result, `Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
      })
    })
  }

  /**
   * Returns total count of sales types, cached.
   */
  async count(): Promise<number> {
    return record('SalesTypeService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(salesTypes)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of sales types.
   */
  async handleList(filter: SalesTypeFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<SalesTypeDto>> {
    return record('SalesTypeService.handleList', async () => {
      const { search } = filter
      const where = searchFilter(salesTypes.name, search)

      return paginate<SalesTypeDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(salesTypes)
            .where(where)
            .orderBy(sortBy(salesTypes.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(salesTypes).where(where),
      })
    })
  }

  /**
   * Serves sales type detail.
   */
  async handleDetail(id: number): Promise<SalesTypeDto> {
    return record('SalesTypeService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  /**
   * Seeds sales types
   */
  async seed(data: (SalesTypeMutationDto & { id?: number; createdBy: number })[]): Promise<void> {
    return record('SalesTypeService.seed', async () => {
      for (const d of data) {
        const metadata = stampCreate(d.createdBy)

        await db
          .insert(salesTypes)
          .values({
            ...d,
            ...metadata,
          })
          .onConflictDoUpdate({
            target: salesTypes.code,
            set: {
              name: d.name,
              updatedAt: metadata.updatedAt,
              updatedBy: metadata.updatedBy,
            },
          })
      }
    })
  }

  /**
   * Creates a new sales type. Invalidates cache.
   */
  async handleCreate(data: SalesTypeMutationDto, actorId: number): Promise<{ id: number }> {
    return record('SalesTypeService.handleCreate', async () => {
      const code = data.code.trim().toLowerCase()
      const name = data.name.trim()

      await checkConflict({
        table: salesTypes,
        pkColumn: salesTypes.id,
        fields: uniqueFields,
        input: { code },
      })

      const [inserted] = await db
        .insert(salesTypes)
        .values({
          ...data,
          code,
          name,
          ...stampCreate(actorId),
        })
        .returning({ id: salesTypes.id })

      if (!inserted) throw new Error('Failed to create sales type')

      void this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing sales type. Invalidates cache.
   */
  async handleUpdate(id: number, data: Partial<SalesTypeMutationDto>, actorId: number): Promise<{ id: number }> {
    return record('SalesTypeService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const code = data.code ? data.code.trim().toLowerCase() : existing.code
      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: salesTypes,
        pkColumn: salesTypes.id,
        fields: uniqueFields,
        input: { code },
        existing,
      })

      await db
        .update(salesTypes)
        .set({
          ...data,
          code,
          name,
          ...stampUpdate(actorId),
        })
        .where(eq(salesTypes.id, id))

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes sales type. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('SalesTypeService.handleRemove', async () => {
      const result = await db.delete(salesTypes).where(eq(salesTypes.id, id)).returning({ id: salesTypes.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant sales type caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}

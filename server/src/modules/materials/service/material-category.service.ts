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

import { materialCategories } from '@/db/schema'

import { db } from '@/db'

import type { MaterialCategoryDto, MaterialCategoryFilterDto, MaterialCategoryMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) =>
    new NotFoundError(`Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND'),
}

const uniqueFields: ConflictField<'name'>[] = [
  {
    field: 'name',
    column: materialCategories.name,
    message: 'Material category name already exists',
    code: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'materialCategory.count',
  list: 'materialCategory.list',
  byId: (id: number) => `materialCategory.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialCategoryService {
  /**
   * Returns all material categories, cached.
   */
  async find(): Promise<MaterialCategoryDto[]> {
    return record('MaterialCategoryService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(materialCategories).orderBy(materialCategories.name)
      })
    })
  }

  /**
   * Finds a single material category by ID. Throws if not found.
   */
  async findById(id: number): Promise<MaterialCategoryDto> {
    return record('MaterialCategoryService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(materialCategories).where(eq(materialCategories.id, id))
        return takeFirstOrThrow(result, `Material category with ID ${id} not found`, 'MATERIAL_CATEGORY_NOT_FOUND')
      })
    })
  }

  /**
   * Returns total count of material categories, cached.
   */
  async count(): Promise<number> {
    return record('MaterialCategoryService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(materialCategories)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of material categories.
   */
  async handleList(
    filter: MaterialCategoryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<MaterialCategoryDto>> {
    return record('MaterialCategoryService.handleList', async () => {
      const { search } = filter
      const where = searchFilter(materialCategories.name, search)

      return paginate<MaterialCategoryDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(materialCategories)
            .where(where)
            .orderBy(sortBy(materialCategories.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(materialCategories).where(where),
      })
    })
  }

  /**
   * Serves material category detail.
   */
  async handleDetail(id: number): Promise<MaterialCategoryDto> {
    return record('MaterialCategoryService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  /**
   * Creates a new material category. Invalidates cache.
   */
  async handleCreate(data: MaterialCategoryMutationDto, actorId: number): Promise<{ id: number }> {
    return record('MaterialCategoryService.handleCreate', async () => {
      const name = data.name.trim()

      await checkConflict({
        table: materialCategories,
        pkColumn: materialCategories.id,
        fields: uniqueFields,
        input: { name },
      })

      const [inserted] = await db
        .insert(materialCategories)
        .values({
          ...data,
          name,
          ...stampCreate(actorId),
        })
        .returning({ id: materialCategories.id })

      if (!inserted) throw new Error('Failed to create material category')

      void this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing material category. Invalidates cache.
   */
  async handleUpdate(id: number, data: Partial<MaterialCategoryMutationDto>, actorId: number): Promise<{ id: number }> {
    return record('MaterialCategoryService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: materialCategories,
        pkColumn: materialCategories.id,
        fields: uniqueFields,
        input: { name },
        existing,
      })

      await db
        .update(materialCategories)
        .set({
          ...data,
          name,
          ...stampUpdate(actorId),
        })
        .where(eq(materialCategories.id, id))

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes material category. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('MaterialCategoryService.handleRemove', async () => {
      const result = await db
        .delete(materialCategories)
        .where(eq(materialCategories.id, id))
        .returning({ id: materialCategories.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant material category caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}

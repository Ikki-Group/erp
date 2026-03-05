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

import { db } from '@/db'
import { productCategories } from '@/db/schema'

import type { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: number) => new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND'),
}

const uniqueFields: ConflictField<'name'>[] = [
  {
    field: 'name',
    column: productCategories.name,
    message: 'Product category name already exists',
    code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'productCategory.count',
  list: 'productCategory.list',
  byId: (id: number) => `productCategory.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class ProductCategoryService {
  /**
   * Returns all product categories, cached.
   */
  async find(): Promise<ProductCategoryDto[]> {
    return record('ProductCategoryService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db.select().from(productCategories).orderBy(productCategories.name)
      })
    })
  }

  /**
   * Finds a single product category by ID. Throws if not found.
   */
  async findById(id: number): Promise<ProductCategoryDto> {
    return record('ProductCategoryService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(productCategories).where(eq(productCategories.id, id))
        return takeFirstOrThrow(result, `Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND')
      })
    })
  }

  /**
   * Returns total count of product categories, cached.
   */
  async count(): Promise<number> {
    return record('ProductCategoryService.count', async () => {
      return cache.wrap(cacheKey.count, async () => {
        const result = await db.select({ val: count() }).from(productCategories)
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of product categories.
   */
  async handleList(
    filter: ProductCategoryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<ProductCategoryDto>> {
    return record('ProductCategoryService.handleList', async () => {
      const { search } = filter
      const where = searchFilter(productCategories.name, search)

      return paginate<ProductCategoryDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(productCategories)
            .where(where)
            .orderBy(sortBy(productCategories.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(productCategories).where(where),
      })
    })
  }

  /**
   * Serves product category detail.
   */
  async handleDetail(id: number): Promise<ProductCategoryDto> {
    return record('ProductCategoryService.handleDetail', async () => {
      return this.findById(id)
    })
  }

  /**
   * Creates a new product category. Invalidates cache.
   */
  async handleCreate(data: ProductCategoryMutationDto, actorId: number): Promise<{ id: number }> {
    return record('ProductCategoryService.handleCreate', async () => {
      const name = data.name.trim()

      await checkConflict({
        table: productCategories,
        pkColumn: productCategories.id,
        fields: uniqueFields,
        input: { name },
      })

      const [inserted] = await db
        .insert(productCategories)
        .values({
          ...data,
          name,
          ...stampCreate(actorId),
        })
        .returning({ id: productCategories.id })

      if (!inserted) throw new Error('Failed to create product category')

      void this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing product category. Invalidates cache.
   */
  async handleUpdate(id: number, data: Partial<ProductCategoryMutationDto>, actorId: number): Promise<{ id: number }> {
    return record('ProductCategoryService.handleUpdate', async () => {
      const existing = await this.findById(id)

      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: productCategories,
        pkColumn: productCategories.id,
        fields: uniqueFields,
        input: { name },
        existing,
      })

      await db
        .update(productCategories)
        .set({
          ...data,
          name,
          ...stampUpdate(actorId),
        })
        .where(eq(productCategories.id, id))

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Removes product category. Invalidates cache.
   */
  async handleRemove(id: number): Promise<{ id: number }> {
    return record('ProductCategoryService.handleRemove', async () => {
      const result = await db
        .delete(productCategories)
        .where(eq(productCategories.id, id))
        .returning({ id: productCategories.id })
      if (result.length === 0) throw err.notFound(id)

      void this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant product category caches.
   */
  private async clearCache(id?: number) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}

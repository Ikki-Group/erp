import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

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
import { productCategoriesTable } from '@/db/schema'

import type { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
  notFound: (id: string) => new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND'),
}

const uniqueFields: ConflictField<'name'>[] = [
  {
    field: 'name',
    column: productCategoriesTable.name,
    message: 'Product category name already exists',
    code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
  },
]

const cacheKey = {
  count: 'productCategory.count',
  list: 'productCategory.list',
  byId: (id: string) => `productCategory.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class ProductCategoryService {
  /**
   * Returns all product categories, cached.
   * Excludes soft-deleted records.
   */
  async find(): Promise<ProductCategoryDto[]> {
    return record('ProductCategoryService.find', async () => {
      return cache.wrap(cacheKey.list, async () => {
        return db
          .select()
          .from(productCategoriesTable)
          .where(isNull(productCategoriesTable.deletedAt))
          .orderBy(productCategoriesTable.name)
      })
    })
  }

  /**
   * Finds a single product category by ID. Throws if not found or soft-deleted.
   */
  async getById(id: string): Promise<ProductCategoryDto> {
    return record('ProductCategoryService.getById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db
          .select()
          .from(productCategoriesTable)
          .where(and(eq(productCategoriesTable.id, id), isNull(productCategoriesTable.deletedAt)))
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
        const result = await db
          .select({ val: count() })
          .from(productCategoriesTable)
          .where(isNull(productCategoriesTable.deletedAt))
        return result[0]?.val ?? 0
      })
    })
  }

  /**
   * Fetches paginated list of product categories.
   */
  async handleList(
    filter: ProductCategoryFilterDto,
    pq: PaginationQuery,
  ): Promise<WithPaginationResult<ProductCategoryDto>> {
    return record('ProductCategoryService.handleList', async () => {
      const { search, parentId } = filter

      const where = and(
        isNull(productCategoriesTable.deletedAt),
        searchFilter(productCategoriesTable.name, search),
        parentId ? eq(productCategoriesTable.parentId, parentId) : undefined,
      )

      return paginate<ProductCategoryDto>({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(productCategoriesTable)
            .where(where)
            .orderBy(sortBy(productCategoriesTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(productCategoriesTable).where(where),
      })
    })
  }

  /**
   * Serves product category detail.
   */
  async handleDetail(id: string): Promise<ProductCategoryDto> {
    return record('ProductCategoryService.handleDetail', async () => {
      return this.getById(id)
    })
  }

  /**
   * Creates a new product category. Invalidates cache.
   */
  async handleCreate(data: ProductCategoryMutationDto, actorId: string): Promise<{ id: string }> {
    return record('ProductCategoryService.handleCreate', async () => {
      const name = data.name.trim()

      await checkConflict({
        table: productCategoriesTable,
        pkColumn: productCategoriesTable.id,
        fields: uniqueFields,
        input: { name },
      })

      const [inserted] = await db
        .insert(productCategoriesTable)
        .values({ ...data, name, ...stampCreate(actorId) })
        .returning({ id: productCategoriesTable.id })

      if (!inserted) throw new Error('Failed to create product category')

      await this.clearCache()
      return inserted
    })
  }

  /**
   * Updates existing product category. Invalidates cache.
   */
  async handleUpdate(id: string, data: Partial<ProductCategoryMutationDto>, actorId: string): Promise<{ id: string }> {
    return record('ProductCategoryService.handleUpdate', async () => {
      const existing = await this.getById(id)

      const name = data.name ? data.name.trim() : existing.name

      await checkConflict({
        table: productCategoriesTable,
        pkColumn: productCategoriesTable.id,
        fields: uniqueFields,
        input: { name },
        existing,
      })

      await db
        .update(productCategoriesTable)
        .set({ ...data, name, ...stampUpdate(actorId) })
        .where(eq(productCategoriesTable.id, id))

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Marks a product category as deleted (Soft Delete).
   * Used for crucial entities like Product Categories.
   */
  async handleRemove(id: string, actorId: string): Promise<{ id: string }> {
    return record('ProductCategoryService.handleRemove', async () => {
      const result = await db
        .update(productCategoriesTable)
        .set({ deletedAt: new Date(), deletedBy: actorId })
        .where(eq(productCategoriesTable.id, id))
        .returning({ id: productCategoriesTable.id })

      if (result.length === 0) throw err.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Permanently deletes a product category (Hard Delete).
   * USE WITH CAUTION.
   */
  async handleHardRemove(id: string): Promise<{ id: string }> {
    return record('ProductCategoryService.handleHardRemove', async () => {
      const result = await db
        .delete(productCategoriesTable)
        .where(eq(productCategoriesTable.id, id))
        .returning({ id: productCategoriesTable.id })

      if (result.length === 0) throw err.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  /**
   * Clears relevant product category caches.
   */
  private async clearCache(id?: string) {
    await Promise.all([
      cache.del(cacheKey.count),
      cache.del(cacheKey.list),
      id ? cache.del(cacheKey.byId(id)) : Promise.resolve(),
    ])
  }
}

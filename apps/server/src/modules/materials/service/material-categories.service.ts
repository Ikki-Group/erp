import { db } from '@server/database'
import { materialCategories } from '@server/database/schema'
import { ConflictError, NotFoundError } from '@server/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@server/lib/utils/pagination.util'
import { and, count, eq, ilike, or } from 'drizzle-orm'

interface IFilter {
  search?: string
  isActive?: boolean
}

/**
 * Handles all material category-related business logic including CRUD operations
 */
export class MaterialCategoriesService {
  err = {
    NOT_FOUND: 'MATERIAL_CATEGORY_NOT_FOUND',
    NAME_EXISTS: 'MATERIAL_CATEGORY_NAME_EXISTS',
  }

  /**
   * Builds a dynamic query with filters
   */
  private buildFilteredQuery(filter: IFilter) {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(materialCategories.name, `%${search}%`),
          ilike(materialCategories.description, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(materialCategories.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(materialCategories).where(whereClause).$dynamic()
  }

  /**
   * Lists all material categories matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(materialCategories.id)
  }

  /**
   * Counts total material categories matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(materialCategories.name, `%${search}%`),
          ilike(materialCategories.description, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(materialCategories.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(materialCategories).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists material categories with pagination
   */
  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<typeof materialCategories.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(materialCategories.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a material category by its ID
   */
  async getById(id: number): Promise<typeof materialCategories.$inferSelect> {
    const [category] = await db.select().from(materialCategories).where(eq(materialCategories.id, id)).limit(1)

    if (!category) {
      throw new NotFoundError(`Material category with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return category
  }

  /**
   * Retrieves a material category by its code
   */
  async getByName(name: string): Promise<typeof materialCategories.$inferSelect | null> {
    const [category] = await db
      .select()
      .from(materialCategories)
      .where(ilike(materialCategories.name, name))
      .limit(1)
    return category ?? null
  }

  /**
   * Creates a new material category with validation
   */
  async create(dto: { name: string; description?: string }, createdBy = 1): Promise<typeof materialCategories.$inferSelect> {
    // Check for existing name
    const existing = await this.getByName(dto.name.trim())

    if (existing) {
      throw new ConflictError('Material category with this name already exists', this.err.NAME_EXISTS, {
        name: dto.name,
      })
    }

    // Create category in a transaction
    const [category] = await db.transaction(async (tx) => {
      const newCategory: typeof materialCategories.$inferInsert = {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(materialCategories).values(newCategory).returning()
    })

    return category!
  }

  /**
   * Updates an existing material category
   */
  async update(
    id: number,
    dto: { name?: string; description?: string; isActive?: boolean },
    updatedBy = 1
  ): Promise<typeof materialCategories.$inferSelect> {
    // Check if category exists
    const category = await this.getById(id)

    // Check for name uniqueness if name is being updated
    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.getByName(dto.name.trim())
      if (existing) {
        throw new ConflictError('Material category name already in use', this.err.NAME_EXISTS, { name: dto.name })
      }
    }

    // Update category in a transaction
    const [updatedCategory] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof materialCategories.$inferInsert> = {
        updatedBy,
      }

      if (dto.name) updateData.name = dto.name.trim()
      if (dto.description !== undefined) updateData.description = dto.description?.trim() ?? null
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive

      return tx.update(materialCategories).set(updateData).where(eq(materialCategories.id, id)).returning()
    })

    return updatedCategory!
  }

  /**
   * Deletes a material category permanently
   */
  async delete(id: number): Promise<void> {
    const category = await this.getById(id)

    if (!category) {
      throw new NotFoundError(`Material category with ID ${id} not found`, this.err.NOT_FOUND)
    }

    await db.delete(materialCategories).where(eq(materialCategories.id, id))
  }

  /**
   * Toggles material category active status
   */
  async toggleActive(id: number, updatedBy = 1): Promise<typeof materialCategories.$inferSelect> {
    const category = await this.getById(id)

    const [updatedCategory] = await db
      .update(materialCategories)
      .set({
        isActive: !category.isActive,
        updatedBy,
      })
      .where(eq(materialCategories.id, id))
      .returning()

    return updatedCategory!
  }
}

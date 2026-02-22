import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { itemCategories } from '@/database/schema'

import type { ItemCategoryCreateDto, ItemCategoryDto, ItemCategoryFilterDto, ItemCategoryUpdateDto } from '../dto'

const err = {
  notFound: (id: number) => `Item category with ID ${id} not found`,
  nameConflict: (name: string) => `Item category name ${name} already exists`,
}

export class ItemCategoryService {
  #buildWhere(filter: ItemCategoryFilterDto) {
    const { name } = filter
    const conditions = []

    if (name) {
      conditions.push(ilike(itemCategories.name, `%${name}%`))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async #checkConflict(name: string, selected?: ItemCategoryDto): Promise<void> {
    const excludeId = selected?.id
    const conditions = []

    if (!selected || selected.name !== name) {
      conditions.push(eq(itemCategories.name, name))
    }

    if (conditions.length === 0) return

    const where = excludeId ? and(or(...conditions), not(eq(itemCategories.id, excludeId))) : or(...conditions)
    const found = await db
      .select({ id: itemCategories.id, name: itemCategories.name })
      .from(itemCategories)
      .where(where)

    if (found.length === 0) return

    const nameConflict = found.some((r) => r.name === name)
    if (nameConflict) throw err.nameConflict(name)
  }

  async count(filter: ItemCategoryFilterDto): Promise<number> {
    const where = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(itemCategories).where(where)
    return result?.total ?? 0
  }

  async find(filter: ItemCategoryFilterDto): Promise<ItemCategoryDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(itemCategories).where(where).orderBy(itemCategories.name)
  }

  async findPaginated(
    filter: ItemCategoryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<ItemCategoryDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(itemCategories).where(where).orderBy(itemCategories.name).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<ItemCategoryDto> {
    const [category] = await db.select().from(itemCategories).where(eq(itemCategories.id, id)).limit(1)

    if (!category) throw err.notFound(id)
    return category
  }

  async create(input: ItemCategoryCreateDto, createdBy = 1): Promise<ItemCategoryDto> {
    await this.#checkConflict(input.name)

    const [category] = await db
      .insert(itemCategories)
      .values({
        ...input,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!category) throw new Error('Failed to create item category')
    return category
  }

  async update(id: number, input: ItemCategoryUpdateDto, updatedBy = 1): Promise<ItemCategoryDto> {
    const selected = await this.findById(id)
    await this.#checkConflict(input.name, selected)

    const [category] = await db
      .update(itemCategories)
      .set({
        ...input,
        updatedBy,
      })
      .where(eq(itemCategories.id, id))
      .returning()

    if (!category) throw err.notFound(id)
    return category
  }

  async remove(id: number): Promise<void> {
    const category = await this.findById(id)
    if (!category) throw err.notFound(id)
    await db.delete(itemCategories).where(eq(itemCategories.id, id))
  }
}

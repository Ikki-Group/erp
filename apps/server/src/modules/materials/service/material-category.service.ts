import { and, count, eq, ilike } from 'drizzle-orm'

import { NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { materialCategoryTable } from '@/database/schema'

import type { MaterialCategoryDto, MaterialCategoryFilterDto } from '../dto'

const err = {
  notFound: (id: number) => new NotFoundError(`Material category with ID ${id} not found`),
}

export class MaterialCategoryService {
  #buildWhere(filter: MaterialCategoryFilterDto) {
    const { search } = filter
    const conditions = []

    if (search) {
      conditions.push(ilike(materialCategoryTable.name, `%${search}%`))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async count(filter?: MaterialCategoryFilterDto): Promise<number> {
    const qry = db.select({ total: count() }).from(materialCategoryTable).$dynamic()
    if (filter) qry.where(this.#buildWhere(filter))
    const [result] = await qry.execute()
    return result?.total ?? 0
  }

  async find(filter: MaterialCategoryFilterDto): Promise<MaterialCategoryDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(materialCategoryTable).where(where)
  }

  async findPaginated(
    filter: MaterialCategoryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<MaterialCategoryDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(materialCategoryTable).where(where).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<MaterialCategoryDto> {
    const [category] = await db.select().from(materialCategoryTable).where(eq(materialCategoryTable.id, id)).limit(1)

    if (!category) throw err.notFound(id)
    return category
  }

  async create(data: MaterialCategoryDto): Promise<MaterialCategoryDto> {
    const [category] = await db
      .insert(materialCategoryTable)
      .values({
        ...data,
      })
      .returning()

    if (!category) throw new Error('Failed to create material category')
    return category
  }

  async update(id: number, data: MaterialCategoryDto): Promise<MaterialCategoryDto> {
    const [category] = await db
      .update(materialCategoryTable)
      .set({
        ...data,
      })
      .where(eq(materialCategoryTable.id, id))
      .returning()

    if (!category) throw err.notFound(id)
    return category
  }

  async remove(id: number): Promise<void> {
    await db.delete(materialCategoryTable).where(eq(materialCategoryTable.id, id))
  }
}

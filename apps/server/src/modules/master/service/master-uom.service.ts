import { db } from '@server/database'
import { uoms } from '@server/database/schema'
import { NotFoundError } from '@server/lib/error/http'
import { calculatePaginationMeta, withPagination, type PaginationQuery } from '@server/lib/utils/pagination.util'
import { and, count, eq, ilike } from 'drizzle-orm'

interface IFilter {
  code?: string
}

export class MasterUomService {
  private buildFilteredQuery(filter: IFilter) {
    const { code } = filter
    const conditions = []

    if (code) {
      conditions.push(ilike(uoms.code, `%${code}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(uoms).where(whereClause).$dynamic()
  }

  async count(filter: IFilter): Promise<number> {
    const { code } = filter
    const conditions = []

    if (code) {
      conditions.push(ilike(uoms.code, `%${code}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(uoms).where(whereClause)

    return result?.total ?? 0
  }

  async list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(uoms.code)
  }

  async listPaginated(filter: IFilter, pq: PaginationQuery) {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(uoms.code).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  async getById(code: string) {
    const [uom] = await db.select().from(uoms).where(eq(uoms.code, code)).limit(1)

    if (!uom) {
      throw new NotFoundError(`UOM with ID ${code} not found`, 'UOM_NOT_FOUND')
    }

    return uom
  }

  async create(name: string, createdBy = 1) {
    const code = name.toUpperCase().trim()
    const [uom] = await db
      .insert(uoms)
      .values({
        code,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    return uom!
  }

  async update(code: string, isActive: boolean, updatedBy = 1) {
    const [uom] = await db
      .update(uoms)
      .set({
        isActive,
        updatedBy,
      })
      .where(eq(uoms.code, code))
      .returning()

    return uom!
  }

  async delete(code: string) {
    const [uom] = await db.delete(uoms).where(eq(uoms.code, code)).returning()
    return uom!
  }
}

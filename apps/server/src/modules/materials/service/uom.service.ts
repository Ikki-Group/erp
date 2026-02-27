import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, InternalServerError, NotFoundError } from '@/lib/error/http'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { uomTable } from '@/database/schema'

import type { UomCreateDto, UomDto, UomFilterDto, UomUpdateDto } from '../dto'

const err = {
  notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`),
  conflict: (code: string) => new ConflictError(`UOM code ${code} already exists`),
}

export class UomService {
  #buildWhere(filter: UomFilterDto) {
    const { search } = filter
    const conditions = []

    if (search) {
      conditions.push(ilike(uomTable.code, `%${search}%`))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async #checkConflict(data: Pick<UomDto, 'code'>, selected?: UomDto): Promise<void> {
    const conditions = []

    if (!selected || selected.code !== data.code) {
      conditions.push(eq(uomTable.code, data.code))
    }

    if (conditions.length === 0) return

    const whereClause = selected ? and(or(...conditions), not(eq(uomTable.code, selected.code))) : or(...conditions)
    const existing = await db.select({ code: uomTable.code }).from(uomTable).where(whereClause).limit(1)

    if (existing.length === 0) return
    throw err.conflict(data.code)
  }

  async count(filter?: UomFilterDto): Promise<number> {
    const qry = db.select({ total: count() }).from(uomTable).$dynamic()
    if (filter) qry.where(this.#buildWhere(filter))
    const [result] = await qry.execute()
    return result?.total ?? 0
  }

  async find(filter: UomFilterDto): Promise<UomDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(uomTable).where(where).orderBy(uomTable.code)
  }

  async findPaginated(filter: UomFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UomDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(uomTable).where(where).orderBy(uomTable.code).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findById(id: number): Promise<UomDto> {
    const [uom] = await db.select().from(uomTable).where(eq(uomTable.id, id)).limit(1)

    if (!uom) throw err.notFound(id)
    return uom
  }

  async create(data: UomCreateDto, createdBy = 1): Promise<UomDto> {
    await this.#checkConflict(data)

    const [uom] = await db
      .insert(uomTable)
      .values({
        ...data,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!uom) throw new InternalServerError('Failed to create UOM')
    return uom
  }

  async update(data: UomUpdateDto, updatedBy = 1): Promise<UomDto> {
    const uom = await this.findById(data.id)

    await this.#checkConflict(data, uom)

    const [updatedUom] = await db
      .update(uomTable)
      .set({
        ...data,
        updatedBy,
      })
      .where(eq(uomTable.id, data.id))
      .returning()

    if (!updatedUom) throw err.notFound(uom.id)
    return updatedUom
  }

  async remove(id: number): Promise<void> {
    await this.findById(id)
    await db.delete(uomTable).where(eq(uomTable.id, id))
  }
}

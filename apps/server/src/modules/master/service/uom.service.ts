import { and, count, eq, ilike, not, or } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import {
  calculatePaginationMeta,
  withPagination,
  type PaginationQuery,
  type WithPaginationResult,
} from '@/lib/pagination'

import { db } from '@/database'
import { uoms } from '@/database/schema'

import type { UomDto, UomFilterDto, UomMutationDto } from '../dto'

/* -------------------------------- CONSTANT -------------------------------- */

const err = {
  notFound: (code: string) => new NotFoundError(`UOM with code ${code} not found`),
  codeConflict: (code: string) => new ConflictError(`UOM code ${code} already exists`, 'UOM_CODE_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UomService {
  #buildWhere(filter: UomFilterDto) {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(ilike(uoms.code, `%${search}%`))
    }

    if (isActive !== undefined) {
      conditions.push(eq(uoms.isActive, isActive))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async #checkConflict(data: Pick<UomDto, 'code'>, selected?: UomDto): Promise<void> {
    const conditions = []

    if (!selected || selected.code !== data.code) {
      conditions.push(eq(uoms.code, data.code))
    }

    if (conditions.length === 0) return

    const whereClause = selected ? and(or(...conditions), not(eq(uoms.code, selected.code))) : or(...conditions)
    const existing = await db.select({ code: uoms.code }).from(uoms).where(whereClause).limit(1)

    if (existing.length === 0) return
    logger.withMetadata({ existing, selected }).debug("Existing uom's code is conflict")

    const codeConflict = existing.some((u) => u.code === data.code)

    if (codeConflict) throw err.codeConflict(data.code)
  }

  async count(filter: UomFilterDto): Promise<number> {
    const where = this.#buildWhere(filter)
    const [result] = await db.select({ total: count() }).from(uoms).where(where)
    return result?.total ?? 0
  }

  async find(filter: UomFilterDto): Promise<UomDto[]> {
    const where = this.#buildWhere(filter)
    return db.select().from(uoms).where(where).orderBy(uoms.code)
  }

  async findPaginated(filter: UomFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<UomDto>> {
    const where = this.#buildWhere(filter)

    const query = db.select().from(uoms).where(where).orderBy(uoms.code).$dynamic()
    const [data, total] = await Promise.all([withPagination(query, pq).execute(), this.count(filter)])

    return {
      data,
      meta: calculatePaginationMeta(pq, total),
    }
  }

  async findByCode(code: string): Promise<UomDto> {
    const [uom] = await db.select().from(uoms).where(eq(uoms.code, code)).limit(1)

    if (!uom) throw err.notFound(code)
    return uom
  }

  async create(data: UomMutationDto, createdBy = 1): Promise<UomDto> {
    await this.#checkConflict(data)

    const [uom] = await db
      .insert(uoms)
      .values({
        ...data,
        createdBy,
        updatedBy: createdBy,
      })
      .returning()

    if (!uom) throw new Error('Failed to create UOM')
    return uom
  }

  async update(code: string, data: UomMutationDto, updatedBy = 1): Promise<UomDto> {
    const uom = await this.findByCode(code)

    await this.#checkConflict(data, uom)

    const [updatedUom] = await db
      .update(uoms)
      .set({
        ...data,
        updatedBy,
      })
      .where(eq(uoms.code, code))
      .returning()

    if (!updatedUom) throw err.notFound(code)
    return updatedUom
  }

  async remove(code: string): Promise<void> {
    await this.findByCode(code)
    await db.delete(uoms).where(eq(uoms.code, code))
  }
}

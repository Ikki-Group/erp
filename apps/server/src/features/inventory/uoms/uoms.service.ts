import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

import { uoms } from '@/database/schema'
import { db } from '@/database'
import { ConflictError, NotFoundError } from '@/shared/errors/http.error'
import { calculatePaginationMeta } from '@/shared/utils/pagination.util'

import type { UomsDto } from './uom.dto'

export class UomService {
  /**
   * Get all UOMs with pagination and filters
   */
  async getUoms(query: UomsDto.UomQuery) {
    const { page = 1, limit = 10, search, isActive } = query
    const offset = (page - 1) * limit

    const where = and(
      search ? or(ilike(uoms.code, `%${search}%`), ilike(uoms.name, `%${search}%`)) : undefined,
      isActive === undefined ? undefined : eq(uoms.isActive, isActive)
    )

    const [totalResult] = await db.select({ value: count() }).from(uoms).where(where)
    const total = Number(totalResult?.value ?? 0)

    const data = await db.select().from(uoms).where(where).limit(limit).offset(offset).orderBy(desc(uoms.createdAt))

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Get UOM by ID
   */
  async getUomById(id: string) {
    const [uom] = await db.select().from(uoms).where(eq(uoms.id, id)).limit(1)

    if (!uom) throw new NotFoundError('UOM not found')
    return uom
  }

  /**
   * Create new UOM
   */
  async createUom(data: UomsDto.UomCreate) {
    try {
      const [uom] = await db
        .insert(uoms)
        .values({
          code: data.code,
          name: data.name,
          symbol: data.symbol ?? null,
        })
        .returning()

      if (!uom) throw new Error('Failed to create UOM')
      return uom
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new ConflictError('UOM code already exists')
      }
      throw error
    }
  }

  /**
   * Update UOM by ID
   */
  async updateUom(id: string, data: UomsDto.UomUpdate) {
    const [uom] = await db.update(uoms).set(data).where(eq(uoms.id, id)).returning()

    if (!uom) throw new NotFoundError('UOM not found')
    return uom
  }

  /**
   * Delete UOM (soft delete)
   */
  async deleteUom(id: string) {
    const [uom] = await db.update(uoms).set({ isActive: false }).where(eq(uoms.id, id)).returning()

    if (!uom) throw new NotFoundError('UOM not found')
    return uom
  }
}

export const uomsService = new UomService()

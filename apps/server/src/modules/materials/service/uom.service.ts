import { db } from '@server/database'
import { unitsOfMeasure } from '@server/database/schema'
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
 * Handles all UOM-related business logic including CRUD operations
 */
export class UomService {
  err = {
    NOT_FOUND: 'UOM_NOT_FOUND',
    CODE_EXISTS: 'UOM_CODE_EXISTS',
    SYMBOL_EXISTS: 'UOM_SYMBOL_EXISTS',
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
          ilike(unitsOfMeasure.code, `%${search}%`),
          ilike(unitsOfMeasure.name, `%${search}%`),
          ilike(unitsOfMeasure.symbol, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(unitsOfMeasure.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(unitsOfMeasure).where(whereClause).$dynamic()
  }

  /**
   * Lists all UOMs matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(unitsOfMeasure.id)
  }

  /**
   * Counts total UOMs matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(unitsOfMeasure.code, `%${search}%`),
          ilike(unitsOfMeasure.name, `%${search}%`),
          ilike(unitsOfMeasure.symbol, `%${search}%`)
        )
      )
    }

    if (isActive !== undefined) {
      conditions.push(eq(unitsOfMeasure.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(unitsOfMeasure).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists UOMs with pagination
   */
  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<typeof unitsOfMeasure.$inferSelect>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      withPagination(this.buildFilteredQuery(filter).orderBy(unitsOfMeasure.id).$dynamic(), pq).execute(),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a UOM by its ID
   */
  async getById(id: number): Promise<typeof unitsOfMeasure.$inferSelect> {
    const [uom] = await db.select().from(unitsOfMeasure).where(eq(unitsOfMeasure.id, id)).limit(1)

    if (!uom) {
      throw new NotFoundError(`UOM with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return uom
  }

  /**
   * Retrieves a UOM by its code
   */
  async getByCode(code: string): Promise<typeof unitsOfMeasure.$inferSelect | null> {
    const [uom] = await db.select().from(unitsOfMeasure).where(eq(unitsOfMeasure.code, code)).limit(1)
    return uom ?? null
  }

  /**
   * Retrieves a UOM by its symbol
   */
  async getBySymbol(symbol: string): Promise<typeof unitsOfMeasure.$inferSelect | null> {
    const [uom] = await db.select().from(unitsOfMeasure).where(eq(unitsOfMeasure.symbol, symbol)).limit(1)
    return uom ?? null
  }

  /**
   * Creates a new UOM with validation
   */
  async create(
    dto: { code: string; name: string; symbol: string },
    createdBy = 1
  ): Promise<typeof unitsOfMeasure.$inferSelect> {
    // Check for existing code or symbol
    const [existingCode, existingSymbol] = await Promise.all([this.getByCode(dto.code), this.getBySymbol(dto.symbol)])

    if (existingCode) {
      throw new ConflictError('UOM with this code already exists', this.err.CODE_EXISTS, { code: dto.code })
    }

    if (existingSymbol) {
      throw new ConflictError('UOM with this symbol already exists', this.err.SYMBOL_EXISTS, { symbol: dto.symbol })
    }

    // Create UOM in a transaction
    const [uom] = await db.transaction(async (tx) => {
      const newUom: typeof unitsOfMeasure.$inferInsert = {
        code: dto.code.toUpperCase().trim(),
        name: dto.name.trim(),
        symbol: dto.symbol.trim(),
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(unitsOfMeasure).values(newUom).returning()
    })

    return uom!
  }

  /**
   * Updates an existing UOM
   */
  async update(
    id: number,
    dto: { code?: string; name?: string; symbol?: string; isActive?: boolean },
    updatedBy = 1
  ): Promise<typeof unitsOfMeasure.$inferSelect> {
    // Check if UOM exists
    const uom = await this.getById(id)

    // Check for uniqueness if code or symbol is being updated
    if (dto.code && dto.code !== uom.code) {
      const existing = await this.getByCode(dto.code)
      if (existing) {
        throw new ConflictError('UOM code already in use', this.err.CODE_EXISTS, { code: dto.code })
      }
    }

    if (dto.symbol && dto.symbol !== uom.symbol) {
      const existing = await this.getBySymbol(dto.symbol)
      if (existing) {
        throw new ConflictError('UOM symbol already in use', this.err.SYMBOL_EXISTS, { symbol: dto.symbol })
      }
    }

    // Update UOM in a transaction
    const [updatedUom] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof unitsOfMeasure.$inferInsert> = {
        updatedBy,
      }

      if (dto.code) updateData.code = dto.code.toUpperCase().trim()
      if (dto.name) updateData.name = dto.name.trim()
      if (dto.symbol) updateData.symbol = dto.symbol.trim()
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive

      return tx.update(unitsOfMeasure).set(updateData).where(eq(unitsOfMeasure.id, id)).returning()
    })

    return updatedUom!
  }

  /**
   * Deletes a UOM permanently
   */
  async delete(id: number): Promise<void> {
    const uom = await this.getById(id)

    if (!uom) {
      throw new NotFoundError(`UOM with ID ${id} not found`, this.err.NOT_FOUND)
    }

    // Note: Foreign key constraints will prevent deletion if UOM is in use
    await db.delete(unitsOfMeasure).where(eq(unitsOfMeasure.id, id))
  }

  /**
   * Toggles UOM active status
   */
  async toggleActive(id: number, updatedBy = 1): Promise<typeof unitsOfMeasure.$inferSelect> {
    const uom = await this.getById(id)

    const [updatedUom] = await db
      .update(unitsOfMeasure)
      .set({
        isActive: !uom.isActive,
        updatedBy,
      })
      .where(eq(unitsOfMeasure.id, id))
      .returning()

    return updatedUom!
  }
}

import { db } from '@server/database'
import { unitsOfMeasure, uomConversions } from '@server/database/schema'
import { ConflictError, NotFoundError } from '@server/lib/error/http'
import {
  calculatePaginationMeta,
  type PaginationQuery,
  type WithPaginationResult,
} from '@server/lib/utils/pagination.util'
import { and, count, eq } from 'drizzle-orm'

interface IFilter {
  fromUomId?: number
  toUomId?: number
}

/**
 * Handles all UOM conversion-related business logic including CRUD operations
 */
export class UomConversionsService {
  err = {
    NOT_FOUND: 'UOM_CONVERSION_NOT_FOUND',
    CONVERSION_EXISTS: 'UOM_CONVERSION_EXISTS',
    CIRCULAR_CONVERSION: 'CIRCULAR_CONVERSION_NOT_ALLOWED',
    SAME_UOM: 'SAME_UOM_CONVERSION_NOT_ALLOWED',
  }

  /**
   * Builds a dynamic query with filters
   */
  private buildFilteredQuery(filter: IFilter) {
    const { fromUomId, toUomId } = filter
    const conditions = []

    if (fromUomId !== undefined) {
      conditions.push(eq(uomConversions.fromUomId, fromUomId))
    }

    if (toUomId !== undefined) {
      conditions.push(eq(uomConversions.toUomId, toUomId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(uomConversions).where(whereClause).$dynamic()
  }

  /**
   * Lists all UOM conversions matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(uomConversions.id)
  }

  /**
   * Counts total UOM conversions matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { fromUomId, toUomId } = filter
    const conditions = []

    if (fromUomId !== undefined) {
      conditions.push(eq(uomConversions.fromUomId, fromUomId))
    }

    if (toUomId !== undefined) {
      conditions.push(eq(uomConversions.toUomId, toUomId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(uomConversions).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists UOM conversions with pagination and related UOM details
   */
  async listPaginated(filter: IFilter, pq: PaginationQuery): Promise<WithPaginationResult<any>> {
    const { page, limit } = pq

    const [data, total] = await Promise.all([
      db
        .select({
          id: uomConversions.id,
          fromUomId: uomConversions.fromUomId,
          toUomId: uomConversions.toUomId,
          conversionFactor: uomConversions.conversionFactor,
          createdAt: uomConversions.createdAt,
          createdBy: uomConversions.createdBy,
          updatedAt: uomConversions.updatedAt,
          updatedBy: uomConversions.updatedBy,
          fromUom: {
            id: unitsOfMeasure.id,
            code: unitsOfMeasure.code,
            name: unitsOfMeasure.name,
            symbol: unitsOfMeasure.symbol,
          },
        })
        .from(uomConversions)
        .leftJoin(unitsOfMeasure, eq(uomConversions.fromUomId, unitsOfMeasure.id))
        .where(
          filter.fromUomId || filter.toUomId
            ? and(
                filter.fromUomId ? eq(uomConversions.fromUomId, filter.fromUomId) : undefined,
                filter.toUomId ? eq(uomConversions.toUomId, filter.toUomId) : undefined
              )
            : undefined
        )
        .orderBy(uomConversions.id)
        .limit(limit)
        .offset((page - 1) * limit),
      this.count(filter),
    ])

    // Fetch toUom details separately
    const dataWithToUom = await Promise.all(
      data.map(async (item) => {
        const [toUom] = await db
          .select({
            id: unitsOfMeasure.id,
            code: unitsOfMeasure.code,
            name: unitsOfMeasure.name,
            symbol: unitsOfMeasure.symbol,
          })
          .from(unitsOfMeasure)
          .where(eq(unitsOfMeasure.id, item.toUomId))
          .limit(1)

        return {
          ...item,
          toUom: toUom ?? null,
        }
      })
    )

    return {
      data: dataWithToUom,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a UOM conversion by its ID
   */
  async getById(id: number): Promise<typeof uomConversions.$inferSelect> {
    const [conversion] = await db.select().from(uomConversions).where(eq(uomConversions.id, id)).limit(1)

    if (!conversion) {
      throw new NotFoundError(`UOM conversion with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return conversion
  }

  /**
   * Gets conversion factor between two UOMs
   */
  async getConversionFactor(fromUomId: number, toUomId: number): Promise<string | null> {
    const [conversion] = await db
      .select()
      .from(uomConversions)
      .where(and(eq(uomConversions.fromUomId, fromUomId), eq(uomConversions.toUomId, toUomId)))
      .limit(1)

    return conversion?.conversionFactor ?? null
  }

  /**
   * Creates a new UOM conversion with validation
   */
  async create(
    dto: { fromUomId: number; toUomId: number; conversionFactor: string },
    createdBy = 1
  ): Promise<typeof uomConversions.$inferSelect> {
    // Validate same UOM
    if (dto.fromUomId === dto.toUomId) {
      throw new ConflictError('Cannot create conversion for the same UOM', this.err.SAME_UOM)
    }

    // Check for existing conversion
    const existing = await this.getConversionFactor(dto.fromUomId, dto.toUomId)

    if (existing) {
      throw new ConflictError('Conversion already exists for these UOMs', this.err.CONVERSION_EXISTS, {
        fromUomId: dto.fromUomId,
        toUomId: dto.toUomId,
      })
    }

    // Check for circular conversion (reverse already exists)
    const reverse = await this.getConversionFactor(dto.toUomId, dto.fromUomId)

    if (reverse) {
      throw new ConflictError(
        'Reverse conversion already exists. Use the existing conversion instead.',
        this.err.CIRCULAR_CONVERSION,
        {
          fromUomId: dto.toUomId,
          toUomId: dto.fromUomId,
        }
      )
    }

    // Create conversion in a transaction
    const [conversion] = await db.transaction(async (tx) => {
      const newConversion: typeof uomConversions.$inferInsert = {
        fromUomId: dto.fromUomId,
        toUomId: dto.toUomId,
        conversionFactor: dto.conversionFactor,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(uomConversions).values(newConversion).returning()
    })

    return conversion!
  }

  /**
   * Updates an existing UOM conversion
   */
  async update(
    id: number,
    dto: { conversionFactor: string },
    updatedBy = 1
  ): Promise<typeof uomConversions.$inferSelect> {
    // Check if conversion exists
    await this.getById(id)

    // Update conversion in a transaction
    const [updatedConversion] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof uomConversions.$inferInsert> = {
        conversionFactor: dto.conversionFactor,
        updatedBy,
      }

      return tx.update(uomConversions).set(updateData).where(eq(uomConversions.id, id)).returning()
    })

    return updatedConversion!
  }

  /**
   * Deletes a UOM conversion permanently
   */
  async delete(id: number): Promise<void> {
    const conversion = await this.getById(id)

    if (!conversion) {
      throw new NotFoundError(`UOM conversion with ID ${id} not found`, this.err.NOT_FOUND)
    }

    await db.delete(uomConversions).where(eq(uomConversions.id, id))
  }
}

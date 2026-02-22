import { and, eq } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'

import { db } from '@/database'
import { items, itemUnitConversions, uoms } from '@/database/schema'

/**
 * Handles all item unit conversion-related business logic
 */
export class ItemUnitConversionsService {
  err = {
    NOT_FOUND: 'ITEM_UNIT_CONVERSION_NOT_FOUND',
    CONVERSION_EXISTS: 'CONVERSION_ALREADY_EXISTS',
    INVALID_CONVERSION: 'INVALID_CONVERSION',
  }

  /**
   * Lists all unit conversions for a specific item
   */
  async listByItem(itemId: number): Promise<
    {
      id: number
      itemId: number
      fromUnit: string
      toUnit: string
      multiplier: string
      fromUomName: string | null
      toUomName: string | null
    }[]
  > {
    const data = await db
      .select({
        id: itemUnitConversions.id,
        itemId: itemUnitConversions.itemId,
        fromUnit: itemUnitConversions.fromUnit,
        toUnit: itemUnitConversions.toUnit,
        multiplier: itemUnitConversions.multiplier,
        fromUomName: uoms.code,
        toUomName: uoms.code,
      })
      .from(itemUnitConversions)
      .where(eq(itemUnitConversions.itemId, itemId))
      .orderBy(itemUnitConversions.id) // Default ordering

    return data
  }

  /**
   * Retrieves an item unit conversion by its ID
   */
  async getById(id: number): Promise<typeof itemUnitConversions.$inferSelect> {
    const [conversion] = await db.select().from(itemUnitConversions).where(eq(itemUnitConversions.id, id)).limit(1)

    if (!conversion) {
      throw new NotFoundError(`Item Unit Conversion ${id} not found`, this.err.NOT_FOUND)
    }

    return conversion
  }

  /**
   * Assigns a conversion multiplier to an item
   */
  async assignConversion(
    itemId: number,
    fromUnitStr: string,
    toUnitStr: string,
    multiplier: string
  ): Promise<typeof itemUnitConversions.$inferSelect> {
    const fromUnit = fromUnitStr.toUpperCase().trim()
    const toUnit = toUnitStr.toUpperCase().trim()

    if (fromUnit === toUnit) {
      throw new ConflictError('Cannot convert from and to the same unit', this.err.INVALID_CONVERSION)
    }

    const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1)
    if (!item) {
      throw new NotFoundError(`Item with ID ${itemId} not found`, 'ITEM_NOT_FOUND')
    }

    const [uom1] = await db.select().from(uoms).where(eq(uoms.code, fromUnit)).limit(1)
    if (!uom1) {
      throw new NotFoundError(`UOM ${fromUnit} not found`, 'UOM_NOT_FOUND')
    }

    const [uom2] = await db.select().from(uoms).where(eq(uoms.code, toUnit)).limit(1)
    if (!uom2) {
      throw new NotFoundError(`UOM ${toUnit} not found`, 'UOM_NOT_FOUND')
    }

    // Check if conversion is already assigned to this item
    const [existing] = await db
      .select()
      .from(itemUnitConversions)
      .where(
        and(
          eq(itemUnitConversions.itemId, itemId),
          eq(itemUnitConversions.fromUnit, fromUnit),
          eq(itemUnitConversions.toUnit, toUnit)
        )
      )
      .limit(1)

    if (existing) {
      throw new ConflictError(
        'Conversion between these units already assigned to this item',
        this.err.CONVERSION_EXISTS,
        {
          itemId,
          fromUnit,
          toUnit,
        }
      )
    }

    // Create item conversion unit in a transaction
    const [conversion] = await db.transaction(async (tx) => {
      const newMaterialUnit: typeof itemUnitConversions.$inferInsert = {
        itemId,
        fromUnit,
        toUnit,
        multiplier,
      }

      return tx.insert(itemUnitConversions).values(newMaterialUnit).returning()
    })

    return conversion!
  }

  /**
   * Removes a Conversion from an item
   */
  async removeConversion(id: number): Promise<void> {
    const conversion = await this.getById(id)
    await db.delete(itemUnitConversions).where(eq(itemUnitConversions.id, conversion.id))
  }
}

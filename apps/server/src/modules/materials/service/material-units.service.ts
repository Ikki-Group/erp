import { db } from '@server/database'
import { materialUnits, unitsOfMeasure } from '@server/database/schema'
import { ConflictError, NotFoundError } from '@server/lib/error/http'
import { and, eq } from 'drizzle-orm'

/**
 * Handles all material unit-related business logic
 */
export class MaterialUnitsService {
  err = {
    NOT_FOUND: 'MATERIAL_UNIT_NOT_FOUND',
    UOM_ALREADY_ASSIGNED: 'UOM_ALREADY_ASSIGNED_TO_MATERIAL',
    BASE_UNIT_EXISTS: 'BASE_UNIT_ALREADY_EXISTS',
    CANNOT_REMOVE_BASE_UNIT: 'CANNOT_REMOVE_BASE_UNIT',
  }

  /**
   * Lists all UOMs for a specific material with UOM details
   */
  async listByMaterial(materialId: number): Promise<
    {
      id: number
      materialId: number
      uomId: number
      isBaseUnit: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      uom: { id: number; code: string; name: string; symbol: string } | null
    }[]
  > {
    const data = await db
      .select({
        id: materialUnits.id,
        materialId: materialUnits.materialId,
        uomId: materialUnits.uomId,
        isBaseUnit: materialUnits.isBaseUnit,
        createdAt: materialUnits.createdAt,
        createdBy: materialUnits.createdBy,
        updatedAt: materialUnits.updatedAt,
        updatedBy: materialUnits.updatedBy,
        uom: {
          id: unitsOfMeasure.id,
          code: unitsOfMeasure.code,
          name: unitsOfMeasure.name,
          symbol: unitsOfMeasure.symbol,
        },
      })
      .from(materialUnits)
      .leftJoin(unitsOfMeasure, eq(materialUnits.uomId, unitsOfMeasure.id))
      .where(eq(materialUnits.materialId, materialId))
      .orderBy(materialUnits.isBaseUnit) // Base unit first

    return data
  }

  /**
   * Retrieves a material unit by its ID
   */
  async getById(id: number): Promise<typeof materialUnits.$inferSelect> {
    const [materialUnit] = await db.select().from(materialUnits).where(eq(materialUnits.id, id)).limit(1)

    if (!materialUnit) {
      throw new NotFoundError(`Material unit with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return materialUnit
  }

  /**
   * Assigns a UOM to a material
   */
  async assignUom(
    materialId: number,
    uomId: number,
    isBaseUnit: boolean,
    createdBy = 1
  ): Promise<typeof materialUnits.$inferSelect> {
    // Check if UOM is already assigned to this material
    const [existing] = await db
      .select()
      .from(materialUnits)
      .where(and(eq(materialUnits.materialId, materialId), eq(materialUnits.uomId, uomId)))
      .limit(1)

    if (existing) {
      throw new ConflictError('UOM already assigned to this material', this.err.UOM_ALREADY_ASSIGNED, {
        materialId,
        uomId,
      })
    }

    // If setting as base unit, check if base unit already exists
    if (isBaseUnit) {
      const [existingBase] = await db
        .select()
        .from(materialUnits)
        .where(and(eq(materialUnits.materialId, materialId), eq(materialUnits.isBaseUnit, true)))
        .limit(1)

      if (existingBase) {
        throw new ConflictError(
          'Material already has a base unit. Unset the existing base unit first.',
          this.err.BASE_UNIT_EXISTS,
          {
            materialId,
            existingBaseUnitId: existingBase.id,
          }
        )
      }
    }

    // Create material unit in a transaction
    const [materialUnit] = await db.transaction(async (tx) => {
      const newMaterialUnit: typeof materialUnits.$inferInsert = {
        materialId,
        uomId,
        isBaseUnit,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(materialUnits).values(newMaterialUnit).returning()
    })

    return materialUnit!
  }

  /**
   * Sets a UOM as the base unit for a material
   * Unsets the previous base unit if exists
   */
  async setBaseUnit(materialId: number, uomId: number, updatedBy = 1): Promise<typeof materialUnits.$inferSelect> {
    // Check if the UOM is assigned to this material
    const [materialUnit] = await db
      .select()
      .from(materialUnits)
      .where(and(eq(materialUnits.materialId, materialId), eq(materialUnits.uomId, uomId)))
      .limit(1)

    if (!materialUnit) {
      throw new NotFoundError(
        'UOM not assigned to this material. Assign it first before setting as base unit.',
        this.err.NOT_FOUND
      )
    }

    // Update in a transaction
    const [updatedMaterialUnit] = await db.transaction(async (tx) => {
      // Unset all base units for this material
      await tx
        .update(materialUnits)
        .set({ isBaseUnit: false, updatedBy })
        .where(and(eq(materialUnits.materialId, materialId), eq(materialUnits.isBaseUnit, true)))

      // Set the new base unit
      return tx
        .update(materialUnits)
        .set({ isBaseUnit: true, updatedBy })
        .where(eq(materialUnits.id, materialUnit.id))
        .returning()
    })

    return updatedMaterialUnit!
  }

  /**
   * Removes a UOM from a material
   * Prevents removal if it's the base unit
   */
  async removeUom(id: number): Promise<void> {
    const materialUnit = await this.getById(id)

    if (materialUnit.isBaseUnit) {
      throw new ConflictError(
        'Cannot remove base unit. Set another UOM as base unit first.',
        this.err.CANNOT_REMOVE_BASE_UNIT,
        {
          materialUnitId: id,
        }
      )
    }

    await db.delete(materialUnits).where(eq(materialUnits.id, id))
  }
}

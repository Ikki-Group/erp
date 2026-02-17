import { db } from '@server/database'
import { materialUoms, materials, uoms } from '@server/database/schema'
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
      materialId: number
      isBase: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      uom: { code: string; isActive: boolean } | null
    }[]
  > {
    const data = await db
      .select({
        materialId: materialUoms.materialId,
        isBase: materialUoms.isBase,
        createdAt: materialUoms.createdAt,
        createdBy: materialUoms.createdBy,
        updatedAt: materialUoms.updatedAt,
        updatedBy: materialUoms.updatedBy,
        uom: {
          code: materialUoms.uom,
          isActive: uoms.isActive,
        },
      })
      .from(materialUoms)
      .innerJoin(uoms, eq(materialUoms.uom, uoms.code))
      .where(eq(materialUoms.materialId, materialId))
      .orderBy(materialUoms.isBase) // Base unit first

    return data
  }

  /**
   * Retrieves a material UOM by its composite key
   */
  async getByKey(materialId: number, uom: string): Promise<typeof materialUoms.$inferSelect> {
    const [materialUnit] = await db
      .select()
      .from(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uom, uom)))
      .limit(1)

    if (!materialUnit) {
      throw new NotFoundError(
        `Material UOM ${uom} for material ${materialId} not found`,
        this.err.NOT_FOUND
      )
    }

    return materialUnit
  }

  /**
   * Assigns a UOM to a material
   */
  async assignUom(
    materialId: number,
    uom: string,
    isBase: boolean,
    createdBy = 1
  ): Promise<typeof materialUoms.$inferSelect> {
    const uomCode = uom.toUpperCase().trim()
    const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1)
    if (!material) {
      throw new NotFoundError(`Material with ID ${materialId} not found`, this.err.NOT_FOUND)
    }

    const [uomExists] = await db.select().from(uoms).where(eq(uoms.code, uomCode)).limit(1)
    if (!uomExists) {
      throw new NotFoundError(`UOM ${uomCode} not found`, this.err.NOT_FOUND)
    }

    // Check if UOM is already assigned to this material
    const [existing] = await db
      .select()
      .from(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uom, uomCode)))
      .limit(1)

    if (existing) {
      throw new ConflictError('UOM already assigned to this material', this.err.UOM_ALREADY_ASSIGNED, {
        materialId,
        uom: uomCode,
      })
    }

    // If setting as base unit, check if base unit already exists
    if (isBase) {
      const [existingBase] = await db
        .select()
        .from(materialUoms)
        .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.isBase, true)))
        .limit(1)

      if (existingBase) {
        throw new ConflictError(
          'Material already has a base unit. Unset the existing base unit first.',
          this.err.BASE_UNIT_EXISTS,
          {
            materialId,
            existingBaseUom: existingBase.uom,
          }
        )
      }
    }

    // Create material unit in a transaction
    const [materialUnit] = await db.transaction(async (tx) => {
      const newMaterialUnit: typeof materialUoms.$inferInsert = {
        materialId,
        uom: uomCode,
        isBase,
        createdBy,
        updatedBy: createdBy,
      }

      return tx.insert(materialUoms).values(newMaterialUnit).returning()
    })

    return materialUnit!
  }

  /**
   * Sets a UOM as the base unit for a material
   * Unsets the previous base unit if exists
   */
  async setBaseUnit(materialId: number, uom: string, updatedBy = 1): Promise<typeof materialUoms.$inferSelect> {
    const uomCode = uom.toUpperCase().trim()
    // Check if the UOM is assigned to this material
    const [materialUnit] = await db
      .select()
      .from(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uom, uomCode)))
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
        .update(materialUoms)
        .set({ isBase: false, updatedBy })
        .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.isBase, true)))

      // Set the new base unit
      return tx
        .update(materialUoms)
        .set({ isBase: true, updatedBy })
        .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uom, uomCode)))
        .returning()
    })

    return updatedMaterialUnit!
  }

  /**
   * Removes a UOM from a material
   * Prevents removal if it's the base unit
   */
  async removeUom(materialId: number, uom: string): Promise<void> {
    const uomCode = uom.toUpperCase().trim()
    const materialUnit = await this.getByKey(materialId, uomCode)

    if (materialUnit.isBase) {
      throw new ConflictError(
        'Cannot remove base unit. Set another UOM as base unit first.',
        this.err.CANNOT_REMOVE_BASE_UNIT,
        {
          materialId,
          uom: uomCode,
        }
      )
    }

    await db
      .delete(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uom, uomCode)))
  }
}

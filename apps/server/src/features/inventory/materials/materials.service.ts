import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

import { locationMaterials, locations, materials, materialUoms, uoms } from '@/database/schema'
import { db } from '@/database'
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/http.error'
import { calculatePaginationMeta } from '@/shared/utils/pagination.util'

import type { MaterialsDto } from './material.dto'

export class MaterialService {
  /**
   * Get all materials with pagination and filters
   */
  async getMaterials(query: MaterialsDto.MaterialQuery) {
    const { page = 1, limit = 10, search, type, isActive } = query
    const offset = (page - 1) * limit

    const where = and(
      search
        ? or(
            ilike(materials.code, `%${search}%`),
            ilike(materials.name, `%${search}%`),
            ilike(materials.description, `%${search}%`)
          )
        : undefined,
      type ? eq(materials.type, type) : undefined,
      isActive === undefined ? undefined : eq(materials.isActive, isActive)
    )

    const [totalResult] = await db.select({ value: count() }).from(materials).where(where)
    const total = Number(totalResult?.value ?? 0)

    const data = await db
      .select({
        material: materials,
        baseUom: uoms,
      })
      .from(materials)
      .leftJoin(uoms, eq(materials.baseUomId, uoms.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(materials.createdAt))

    return {
      data: data.map((row) => ({
        ...row.material,
        baseUom: row.baseUom,
      })),
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Get material by ID with UOMs
   */
  async getMaterialById(id: string) {
    const [result] = await db
      .select({
        material: materials,
        baseUom: uoms,
      })
      .from(materials)
      .leftJoin(uoms, eq(materials.baseUomId, uoms.id))
      .where(eq(materials.id, id))
      .limit(1)

    if (!result) throw new NotFoundError('Material not found')

    // Get all UOMs for this material
    const materialUomsList = await db
      .select({
        materialUom: materialUoms,
        uom: uoms,
      })
      .from(materialUoms)
      .leftJoin(uoms, eq(materialUoms.uomId, uoms.id))
      .where(and(eq(materialUoms.materialId, id), eq(materialUoms.isActive, true)))

    return {
      ...result.material,
      baseUom: result.baseUom,
      uoms: materialUomsList.map((row) => ({
        ...row.materialUom,
        uom: row.uom,
      })),
    }
  }

  /**
   * Create new material and auto-assign to all warehouses
   */
  async createMaterial(data: MaterialsDto.MaterialCreate) {
    try {
      const [material] = await db
        .insert(materials)
        .values({
          code: data.code,
          name: data.name,
          type: data.type,
          description: data.description ?? null,
          baseUomId: data.baseUomId,
        })
        .returning()

      if (!material) throw new Error('Failed to create material')

      // Auto-assign to all warehouse locations
      await this.autoAssignToWarehouses(material.id)

      // Add base UOM to material UOMs with conversion factor 1.0
      await db.insert(materialUoms).values({
        materialId: material.id,
        uomId: data.baseUomId,
        conversionFactor: '1.0',
      })

      return material
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new ConflictError('Material code already exists')
      }
      throw error
    }
  }

  /**
   * Update material by ID
   */
  async updateMaterial(id: string, data: MaterialsDto.MaterialUpdate) {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning()

    if (!material) throw new NotFoundError('Material not found')
    return material
  }

  /**
   * Delete material (soft delete)
   */
  async deleteMaterial(id: string) {
    const [material] = await db.update(materials).set({ isActive: false }).where(eq(materials.id, id)).returning()

    if (!material) throw new NotFoundError('Material not found')
    return material
  }

  /**
   * Add UOM to material with conversion factor
   */
  async addMaterialUom(materialId: string, data: MaterialsDto.MaterialUomCreate) {
    // Verify material exists
    const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1)
    if (!material) throw new NotFoundError('Material not found')

    // Verify UOM exists
    const [uom] = await db.select().from(uoms).where(eq(uoms.id, data.uomId)).limit(1)
    if (!uom) throw new NotFoundError('UOM not found')

    try {
      const [materialUom] = await db
        .insert(materialUoms)
        .values({
          materialId,
          uomId: data.uomId,
          conversionFactor: data.conversionFactor.toString(),
        })
        .returning()

      if (!materialUom) throw new Error('Failed to add UOM to material')
      return materialUom
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new ConflictError('UOM already added to this material')
      }
      throw error
    }
  }

  /**
   * Update material UOM conversion factor
   */
  async updateMaterialUom(materialId: string, uomId: string, data: MaterialsDto.MaterialUomUpdate) {
    const [materialUom] = await db
      .update(materialUoms)
      .set({ conversionFactor: data.conversionFactor.toString() })
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uomId, uomId)))
      .returning()

    if (!materialUom) throw new NotFoundError('Material UOM not found')
    return materialUom
  }

  /**
   * Remove UOM from material
   */
  async removeMaterialUom(materialId: string, uomId: string) {
    const [materialUom] = await db
      .update(materialUoms)
      .set({ isActive: false })
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uomId, uomId)))
      .returning()

    if (!materialUom) throw new NotFoundError('Material UOM not found')
    return materialUom
  }

  /**
   * Convert quantity between UOMs for a material
   */
  async convertQuantity(materialId: string, data: MaterialsDto.ConvertQuantity) {
    // Get conversion factors for both UOMs
    const [fromUom] = await db
      .select()
      .from(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uomId, data.fromUomId)))
      .limit(1)

    const [toUom] = await db
      .select()
      .from(materialUoms)
      .where(and(eq(materialUoms.materialId, materialId), eq(materialUoms.uomId, data.toUomId)))
      .limit(1)

    if (!fromUom) throw new BadRequestError('Source UOM not found for this material')
    if (!toUom) throw new BadRequestError('Target UOM not found for this material')

    // Convert to base UOM first, then to target UOM
    const fromFactor = Number.parseFloat(fromUom.conversionFactor)
    const toFactor = Number.parseFloat(toUom.conversionFactor)

    const convertedQuantity = (data.quantity * fromFactor) / toFactor

    return {
      originalQuantity: data.quantity,
      fromUomId: data.fromUomId,
      toUomId: data.toUomId,
      convertedQuantity,
    }
  }

  /**
   * Auto-assign material to all warehouse locations
   */
  private async autoAssignToWarehouses(materialId: string) {
    // Get all warehouse locations (type = 'WAREHOUSE')
    const warehouses = await db
      .select()
      .from(locations)
      .where(and(eq(locations.type, 'WAREHOUSE'), eq(locations.isActive, true)))

    if (warehouses.length === 0) return

    // Assign material to all warehouses
    const assignments = warehouses.map((warehouse) => ({
      locationId: warehouse.id,
      materialId,
    }))

    await db.insert(locationMaterials).values(assignments).onConflictDoNothing()
  }
}

export const materialsService = new MaterialService()

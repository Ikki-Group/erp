import { and, count, eq, ilike, or, sql } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/lib/error/http'
import { calculatePaginationMeta, type PaginationQuery, type WithPaginationResult } from '@/lib/utils/pagination.util'

import { db } from '@/database'
import { locationMaterials, locations, materialCategories, materials, materialUoms, uoms } from '@/database/schema'

interface IFilter {
  search?: string
  type?: 'raw' | 'semi'
  categoryId?: number
  isActive?: boolean
}

/**
 * Handles all material-related business logic including CRUD operations
 */
export class MaterialsService {
  err = {
    NOT_FOUND: 'MATERIAL_NOT_FOUND',
    SKU_EXISTS: 'MATERIAL_SKU_EXISTS',
  }

  /**
   * Generates SKU for material
   * Format: RM-{TYPE}-{SEQUENCE}
   * Example: RM-RAW-001, RM-SEMI-002
   */
  private async generateSku(type: 'raw' | 'semi'): Promise<string> {
    const prefix = `RM-${type.toUpperCase()}`

    // Get the last material with this prefix
    const [lastMaterial] = await db
      .select()
      .from(materials)
      .where(sql`${materials.sku} LIKE ${prefix + '-%'}`)
      .orderBy(sql`${materials.sku} DESC`)
      .limit(1)

    if (!lastMaterial) {
      return `${prefix}-001`
    }

    // Extract sequence number from last SKU
    const lastSku = lastMaterial.sku
    const parts = lastSku.split('-')
    const lastSequence = Number.parseInt(parts.at(-1) ?? '0', 10)
    const nextSequence = lastSequence + 1

    return `${prefix}-${nextSequence.toString().padStart(3, '0')}`
  }

  /**
   * Builds a dynamic query with filters
   */
  private buildFilteredQuery(filter: IFilter) {
    const { search, type, categoryId, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(materials.sku, `%${search}%`),
          ilike(materials.name, `%${search}%`),
          ilike(materials.description, `%${search}%`)
        )
      )
    }

    if (type) {
      conditions.push(eq(materials.type, type))
    }

    if (categoryId !== undefined) {
      conditions.push(eq(materials.categoryId, categoryId))
    }

    if (isActive !== undefined) {
      conditions.push(eq(materials.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    return db.select().from(materials).where(whereClause).$dynamic()
  }

  /**
   * Lists all materials matching the filter criteria
   */
  list(filter: IFilter) {
    return this.buildFilteredQuery(filter).orderBy(materials.id)
  }

  /**
   * Counts total materials matching the filter criteria
   */
  async count(filter: IFilter): Promise<number> {
    const { search, type, categoryId, isActive } = filter
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(materials.sku, `%${search}%`),
          ilike(materials.name, `%${search}%`),
          ilike(materials.description, `%${search}%`)
        )
      )
    }

    if (type) {
      conditions.push(eq(materials.type, type))
    }

    if (categoryId !== undefined) {
      conditions.push(eq(materials.categoryId, categoryId))
    }

    if (isActive !== undefined) {
      conditions.push(eq(materials.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const [result] = await db.select({ total: count() }).from(materials).where(whereClause)

    return result?.total ?? 0
  }

  /**
   * Lists materials with pagination and category details
   */
  async listPaginated(
    filter: IFilter,
    pq: PaginationQuery
  ): Promise<
    WithPaginationResult<{
      id: number
      sku: string
      name: string
      description: string | null
      type: 'raw' | 'semi'
      categoryId: number | null
      isActive: boolean
      createdAt: Date
      createdBy: number
      updatedAt: Date
      updatedBy: number
      baseUom: string
      category: { id: number; name: string } | null
    }>
  > {
    const { page, limit } = pq
    const { search, type, categoryId, isActive } = filter

    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(materials.sku, `%${search}%`),
          ilike(materials.name, `%${search}%`),
          ilike(materials.description, `%${search}%`)
        )
      )
    }

    if (type) {
      conditions.push(eq(materials.type, type))
    }

    if (categoryId !== undefined) {
      conditions.push(eq(materials.categoryId, categoryId))
    }

    if (isActive !== undefined) {
      conditions.push(eq(materials.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [data, total] = await Promise.all([
      db
        .select({
          id: materials.id,
          sku: materials.sku,
          name: materials.name,
          description: materials.description,
          type: materials.type,
          categoryId: materials.categoryId,
          baseUom: materials.baseUom,
          isActive: materials.isActive,
          createdAt: materials.createdAt,
          createdBy: materials.createdBy,
          updatedAt: materials.updatedAt,
          updatedBy: materials.updatedBy,
          category: {
            id: materialCategories.id,
            name: materialCategories.name,
          },
        })
        .from(materials)
        .leftJoin(materialCategories, eq(materials.categoryId, materialCategories.id))
        .where(whereClause)
        .orderBy(materials.id)
        .limit(limit)
        .offset((page - 1) * limit),
      this.count(filter),
    ])

    return {
      data,
      meta: calculatePaginationMeta(page, limit, total),
    }
  }

  /**
   * Retrieves a material by its ID
   */
  async getById(id: number): Promise<typeof materials.$inferSelect> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id)).limit(1)

    if (!material) {
      throw new NotFoundError(`Material with ID ${id} not found`, this.err.NOT_FOUND)
    }

    return material
  }

  /**
   * Retrieves a material by its SKU
   */
  async getBySku(sku: string): Promise<typeof materials.$inferSelect | null> {
    const [material] = await db.select().from(materials).where(eq(materials.sku, sku)).limit(1)
    return material ?? null
  }

  /**
   * Creates a new material with validation and auto-assignment to warehouses
   */
  async create(
    dto: {
      sku?: string
      name: string
      description?: string
      type: 'raw' | 'semi'
      categoryId?: number
      baseUom: string
    },
    createdBy = 1
  ): Promise<typeof materials.$inferSelect> {
    // Generate SKU if not provided
    const sku = dto.sku ? dto.sku.toUpperCase().trim() : await this.generateSku(dto.type)

    // Check for existing SKU
    const existing = await this.getBySku(sku)

    if (existing) {
      throw new ConflictError('Material with this SKU already exists', this.err.SKU_EXISTS, { sku })
    }

    const baseUom = dto.baseUom.toUpperCase().trim()

    const [uom] = await db.select().from(uoms).where(eq(uoms.code, baseUom)).limit(1)
    if (!uom) {
      throw new NotFoundError(`UOM ${baseUom} not found`, 'UOM_NOT_FOUND')
    }

    // Create material and auto-assign to warehouses in a transaction
    const [material] = await db.transaction(async (tx) => {
      // Create material
      const newMaterial: typeof materials.$inferInsert = {
        sku,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        type: dto.type,
        categoryId: dto.categoryId ?? null,
        baseUom,
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      }

      const [createdMaterial] = await tx.insert(materials).values(newMaterial).returning()

      await tx.insert(materialUoms).values({
        materialId: createdMaterial!.id,
        uom: baseUom,
        isBase: true,
        conversionFactor: '1',
        createdBy,
        updatedBy: createdBy,
      })

      // Auto-assign to all warehouse and central_warehouse locations
      const warehouseLocations = await tx.select().from(locations).where(eq(locations.type, 'warehouse'))

      if (warehouseLocations.length > 0) {
        const locationMaterialValues = warehouseLocations.map((location) => ({
          locationId: location.id,
          materialId: createdMaterial!.id,
          stockAlertThreshold: '0',
          weightedAvgCost: '0',
          totalValue: '0',
          isActive: true,
          createdBy,
          updatedBy: createdBy,
        }))

        await tx.insert(locationMaterials).values(locationMaterialValues)
      }

      return [createdMaterial]
    })

    return material!
  }

  /**
   * Updates an existing material
   */
  async update(
    id: number,
    dto: {
      sku?: string
      name?: string
      description?: string
      type?: 'raw' | 'semi'
      categoryId?: number | null
      baseUom?: string
      isActive?: boolean
    },
    updatedBy = 1
  ): Promise<typeof materials.$inferSelect> {
    // Check if material exists
    const material = await this.getById(id)

    // Check for SKU uniqueness if SKU is being updated
    if (dto.sku && dto.sku !== material.sku) {
      const existing = await this.getBySku(dto.sku)
      if (existing) {
        throw new ConflictError('Material SKU already in use', this.err.SKU_EXISTS, { sku: dto.sku })
      }
    }

    // Update material in a transaction
    const [updatedMaterial] = await db.transaction(async (tx) => {
      const updateData: Partial<typeof materials.$inferInsert> = {
        updatedBy,
      }

      if (dto.sku) updateData.sku = dto.sku.toUpperCase().trim()
      if (dto.name) updateData.name = dto.name.trim()
      if (dto.description !== undefined) updateData.description = dto.description?.trim() ?? null
      if (dto.type) updateData.type = dto.type
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId
      if (dto.baseUom) updateData.baseUom = dto.baseUom.toUpperCase().trim()
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive

      const [saved] = await tx.update(materials).set(updateData).where(eq(materials.id, id)).returning()

      if (dto.baseUom) {
        const nextBase = dto.baseUom.toUpperCase().trim()
        const [uom] = await tx.select().from(uoms).where(eq(uoms.code, nextBase)).limit(1)
        if (!uom) {
          throw new NotFoundError(`UOM ${nextBase} not found`, 'UOM_NOT_FOUND')
        }

        await tx.update(materialUoms).set({ isBase: false, updatedBy }).where(eq(materialUoms.materialId, id))

        const [existing] = await tx
          .select()
          .from(materialUoms)
          .where(and(eq(materialUoms.materialId, id), eq(materialUoms.uom, nextBase)))
          .limit(1)

        await (existing
          ? tx
              .update(materialUoms)
              .set({ isBase: true, updatedBy })
              .where(and(eq(materialUoms.materialId, id), eq(materialUoms.uom, nextBase)))
          : tx.insert(materialUoms).values({
              materialId: id,
              uom: nextBase,
              isBase: true,
              conversionFactor: '1',
              createdBy: updatedBy,
              updatedBy,
            }))
      }

      return [saved]
    })

    return updatedMaterial!
  }

  /**
   * Deletes a material permanently
   */
  async delete(id: number): Promise<void> {
    const material = await this.getById(id)

    if (!material) {
      throw new NotFoundError(`Material with ID ${id} not found`, this.err.NOT_FOUND)
    }

    // Note: Cascade delete will remove location_materials and material_units
    await db.delete(materials).where(eq(materials.id, id))
  }

  /**
   * Toggles material active status
   */
  async toggleActive(id: number, updatedBy = 1): Promise<typeof materials.$inferSelect> {
    const material = await this.getById(id)

    const [updatedMaterial] = await db
      .update(materials)
      .set({
        isActive: !material.isActive,
        updatedBy,
      })
      .where(eq(materials.id, id))
      .returning()

    return updatedMaterial!
  }
}

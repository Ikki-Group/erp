import { Elysia, t } from 'elysia'

import { MaterialsDto } from '@/features/inventory/materials/materials.dto'
import { materialsService } from '@/features/inventory/materials/materials.service'
import { paginatedResponse, successResponse } from '@/shared/responses'

/**
 * Material Management Controller
 * Handles CRUD operations for materials and material-UOM relationships
 */
export const materialsController = new Elysia({
  prefix: '/inventory/material',
  detail: { tags: ['Inventory - Material'] },
})
  /**
   * Get all materials with pagination and filters
   */
  .get(
    '',
    async ({ query }) => {
      const result = await materialsService.getMaterials(query)
      return paginatedResponse(result.data, result.meta)
    },
    { query: MaterialsDto.MaterialQuery }
  )

  /**
   * Get material by ID with UOMs
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const material = await materialsService.getMaterialById(id)
      return successResponse(material)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
    }
  )

  /**
   * Create new material (auto-assigns to warehouses)
   */
  .post(
    '',
    async ({ body }) => {
      const material = await materialsService.createMaterial(body)
      return successResponse(material, 'Material created successfully and assigned to warehouses')
    },
    { body: MaterialsDto.MaterialCreate }
  )

  /**
   * Update material by ID
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      const material = await materialsService.updateMaterial(id, body)
      return successResponse(material, 'Material updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
      body: MaterialsDto.MaterialUpdate,
    }
  )

  /**
   * Delete material by ID (soft delete)
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      const material = await materialsService.deleteMaterial(id)
      return successResponse(material, 'Material deleted successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
    }
  )

  /**
   * Add UOM to material
   */
  .post(
    '/:id/uom',
    async ({ params: { id }, body }) => {
      const materialUom = await materialsService.addMaterialUom(id, body)
      return successResponse(materialUom, 'UOM added to material successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
      body: MaterialsDto.MaterialUomCreate,
    }
  )

  /**
   * Update material UOM conversion factor
   */
  .put(
    '/:id/uom/:uomId',
    async ({ params: { id, uomId }, body }) => {
      const materialUom = await materialsService.updateMaterialUom(id, uomId, body)
      return successResponse(materialUom, 'UOM conversion updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
        uomId: t.String({ format: 'uuid', description: 'UOM ID' }),
      }),
      body: MaterialsDto.MaterialUomUpdate,
    }
  )

  /**
   * Remove UOM from material
   */
  .delete(
    '/:id/uom/:uomId',
    async ({ params: { id, uomId } }) => {
      const materialUom = await materialsService.removeMaterialUom(id, uomId)
      return successResponse(materialUom, 'UOM removed from material successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
        uomId: t.String({ format: 'uuid', description: 'UOM ID' }),
      }),
    }
  )

  /**
   * Convert quantity between UOMs
   */
  .post(
    '/:id/convert',
    async ({ params: { id }, body }) => {
      const result = await materialsService.convertQuantity(id, body)
      return successResponse(result)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
      body: MaterialsDto.ConvertQuantity,
    }
  )

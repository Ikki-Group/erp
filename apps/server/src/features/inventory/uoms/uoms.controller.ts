import { Elysia, t } from 'elysia'

import { UomsDto } from '@/features/inventory/uoms/uoms.dto'
import { uomsService } from '@/features/inventory/uoms/uoms.service'
import { paginatedResponse, successResponse } from '@/shared/responses'

/**
 * UOM (Unit of Measure) Controller
 * Handles CRUD operations for units of measure
 */
export const uomsController = new Elysia({
  prefix: '/inventory/uom',
  detail: { tags: ['Inventory - UOM'] },
})
  /**
   * Get all UOMs with pagination and filters
   */
  .get(
    '',
    async ({ query }) => {
      const result = await uomsService.getUoms(query)
      return paginatedResponse(result.data, result.meta)
    },
    { query: UomsDto.UomQuery }
  )

  /**
   * Get UOM by ID
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const uom = await uomsService.getUomById(id)
      return successResponse(uom)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'UOM ID' }),
      }),
    }
  )

  /**
   * Create new UOM
   */
  .post(
    '',
    async ({ body }) => {
      const uom = await uomsService.createUom(body)
      return successResponse(uom, 'UOM created successfully')
    },
    { body: UomsDto.UomCreate }
  )

  /**
   * Update UOM by ID
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      const uom = await uomsService.updateUom(id, body)
      return successResponse(uom, 'UOM updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'UOM ID' }),
      }),
      body: UomsDto.UomUpdate,
    }
  )

  /**
   * Delete UOM by ID (soft delete)
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      const uom = await uomsService.deleteUom(id)
      return successResponse(uom, 'UOM deleted successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'UOM ID' }),
      }),
    }
  )

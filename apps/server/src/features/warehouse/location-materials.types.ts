import z from 'zod'

import { zh } from '@/shared/zod'

import { MaterialEntity } from './material.entity'

export const LocationMaterialEntity = z.object({
  id: zh.uuid,
  locationId: zh.uuid,
  materialId: zh.uuid,
  isActive: zh.bool,
  createdAt: zh.date,
})

export type LocationMaterialEntity = z.infer<typeof LocationMaterialEntity>

export const LocationMaterialWithDetailsEntity = LocationMaterialEntity.extend({
  material: MaterialEntity,
})

export type LocationMaterialWithDetailsEntity = z.infer<typeof LocationMaterialWithDetailsEntity>

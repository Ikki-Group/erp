import z from 'zod'

import { zh } from '@/shared/zod'

import { UomEntity } from './uom.entity'

export const MaterialEntity = z.object({
  id: zh.uuid,
  code: zh.str,
  name: zh.str,
  type: zh.str, // 'raw' or 'semi'
  description: zh.str.nullable(),
  baseUomId: zh.uuid,
  isActive: zh.bool,
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type MaterialEntity = z.infer<typeof MaterialEntity>

export const MaterialWithUomEntity = MaterialEntity.extend({
  baseUom: UomEntity,
})

export type MaterialWithUomEntity = z.infer<typeof MaterialWithUomEntity>

export const MaterialUomEntity = z.object({
  id: zh.uuid,
  materialId: zh.uuid,
  uomId: zh.uuid,
  conversionFactor: zh.str, // decimal as string
  isActive: zh.bool,
  createdAt: zh.date,
})

export type MaterialUomEntity = z.infer<typeof MaterialUomEntity>

export const MaterialUomWithDetailsEntity = MaterialUomEntity.extend({
  uom: UomEntity,
})

export type MaterialUomWithDetailsEntity = z.infer<typeof MaterialUomWithDetailsEntity>

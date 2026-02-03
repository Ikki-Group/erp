import { z } from 'zod'

import { zh } from '@/shared/zod'

export namespace MaterialsDto {
  /**
   * QUERY
   */
  export const MaterialQuery = zh.pagination.extend({
    search: z.string().optional(),
    type: z.enum(['raw', 'semi']).optional(),
    isActive: z.coerce.boolean().optional(),
  })
  export type MaterialQuery = z.infer<typeof MaterialQuery>

  /**
   * CREATE
   */
  export const MaterialCreate = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    type: z.enum(['raw', 'semi']),
    description: z.string().optional(),
    baseUomId: zh.uuid,
  })
  export type MaterialCreate = z.infer<typeof MaterialCreate>

  /**
   * UPDATE
   */
  export const MaterialUpdate = MaterialCreate.partial().omit({ code: true })
  export type MaterialUpdate = z.infer<typeof MaterialUpdate>

  /**
   * MATERIAL UOM
   */
  export const MaterialUomCreate = z.object({
    uomId: zh.uuid,
    conversionFactor: z.coerce.number().positive(),
  })
  export type MaterialUomCreate = z.infer<typeof MaterialUomCreate>

  export const MaterialUomUpdate = z.object({
    conversionFactor: z.coerce.number().positive(),
  })
  export type MaterialUomUpdate = z.infer<typeof MaterialUomUpdate>

  /**
   * CONVERSION
   */
  export const ConvertQuantity = z.object({
    quantity: z.coerce.number(),
    fromUomId: zh.uuid,
    toUomId: zh.uuid,
  })
  export type ConvertQuantity = z.infer<typeof ConvertQuantity>
}

import { z } from 'zod'

import { zh } from '@/shared/zod'

export namespace UomsDto {
  /**
   * QUERY
   */
  export const UomQuery = zh.pagination.extend({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  })
  export type UomQuery = z.infer<typeof UomQuery>

  /**
   * CREATE
   */
  export const UomCreate = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    symbol: z.string().max(10).optional(),
  })
  export type UomCreate = z.infer<typeof UomCreate>

  /**
   * UPDATE
   */
  export const UomUpdate = UomCreate.partial().omit({ code: true })
  export type UomUpdate = z.infer<typeof UomUpdate>
}

import { z } from 'zod'

import { zh } from '@/shared/zod'

export namespace LocationDto {
  /**
   * QUERY
   */
  export const LocationQuery = zh.pagination.extend({
    search: z.string().optional(),
    type: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  })
  export type LocationQuery = z.infer<typeof LocationQuery>

  /**
   * CREATE
   */
  export const LocationCreate = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(50),
    address: z.string().max(1000).optional(),
    city: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    phone: z.string().max(50).optional(),
    email: zh.email.optional(),
  })
  export type LocationCreate = z.infer<typeof LocationCreate>

  /**
   * UPDATE
   */
  export const LocationUpdate = LocationCreate.partial().omit({ code: true })
  export type LocationUpdate = z.infer<typeof LocationUpdate>
}

import z from 'zod'

import { zSchema } from '@/lib/zod'

export const LocationType = z.enum(['store', 'warehouse'])

export type LocationType = z.infer<typeof LocationType>

export const LocationSchema = z.object({
  id: zSchema.num,
  code: zSchema.str,
  name: zSchema.str,
  type: LocationType,
  description: z.string().nullable(),
  isActive: zSchema.bool,
  ...zSchema.meta.shape,
})

export type LocationSchema = z.infer<typeof LocationSchema>

import z from 'zod'

import { zh } from '@/shared/zod'

export const LocationEntity = z.object({
  id: zh.uuid,
  code: zh.str,
  name: zh.str,
  type: zh.str,
  address: zh.str.nullable(),
  city: zh.str.nullable(),
  province: zh.str.nullable(),
  postalCode: zh.str.nullable(),
  phone: zh.str.nullable(),
  email: zh.email.nullable(),
  isActive: zh.bool,
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type LocationEntity = z.infer<typeof LocationEntity>

import z from 'zod'

import { zh } from '@/shared/zod'

export const UomEntity = z.object({
  id: zh.uuid,
  code: zh.str,
  name: zh.str,
  symbol: zh.str.nullable(),
  isActive: zh.bool,
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type UomEntity = z.infer<typeof UomEntity>

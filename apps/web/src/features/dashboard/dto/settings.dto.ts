import { zPrimitive } from '@/lib/zod'
import z from 'zod'

export const SettingSummaryDto = z.object({
  users: zPrimitive.num,
  roles: zPrimitive.num,
  locations: zPrimitive.num,
})

export type SettingSummaryDto = z.infer<typeof SettingSummaryDto>

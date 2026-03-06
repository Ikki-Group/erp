import z from 'zod'

import { zPrimitive } from '@/lib/validation'

export const SettingsSummaryDto = z.object({
  users: zPrimitive.num,
  roles: zPrimitive.num,
  locations: zPrimitive.num,
})

export type SettingsSummaryDto = z.infer<typeof SettingsSummaryDto>

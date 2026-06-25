import { z } from 'zod'
import { zp } from '@/shared/schema'

export const SettingsSummaryDto = z.object({
	users: zp.num,
	roles: zp.num,
	locations: zp.num,
})

export type SettingsSummaryDto = z.infer<typeof SettingsSummaryDto>

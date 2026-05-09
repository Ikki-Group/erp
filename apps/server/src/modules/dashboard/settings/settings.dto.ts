import { z, zp } from '@ikki/api-contract/validation'

export const SettingsSummaryDto = z.object({
	users: zp.num,
	roles: zp.num,
	locations: zp.num,
})

export type SettingsSummaryDto = z.infer<typeof SettingsSummaryDto>

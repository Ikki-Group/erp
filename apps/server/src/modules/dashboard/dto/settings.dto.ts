import z from 'zod'

import { zNum } from '@/core/validation'

export const SettingsSummaryDto = z.object({ users: zNum, roles: zNum, locations: zNum })

export type SettingsSummaryDto = z.infer<typeof SettingsSummaryDto>

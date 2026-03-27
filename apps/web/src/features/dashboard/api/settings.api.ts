import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import { SettingsSummaryDto } from '../dto/settings.dto'

export const settingsApi = {
  summary: apiFactory({ method: 'get', url: 'dashboard/settings/summary', result: createSuccessResponseSchema(SettingsSummaryDto) }),
}

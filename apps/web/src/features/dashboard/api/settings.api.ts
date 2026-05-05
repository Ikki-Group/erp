import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@ikki/api-contract/validation'

import { SettingsSummaryDto } from '../dto/settings.dto'

export const settingsApi = {
	summary: apiFactory({
		method: 'get',
		url: endpoint.dashboard.settings.summary,
		result: createSuccessResponseSchema(SettingsSummaryDto),
	}),
}

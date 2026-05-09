import { createSuccessResponseSchema } from '@ikki/api-contract/validation'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'

import { SettingsSummaryDto } from '../dto/settings.dto'

export const settingsApi = {
	summary: apiFactory({
		method: 'get',
		url: endpoint.dashboard.settings.summary,
		result: createSuccessResponseSchema(SettingsSummaryDto),
	}),
}

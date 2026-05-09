import { createSuccessResponseSchema } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/core/http/response'

import { SettingsSummaryDto } from './settings.dto'
import type { SettingsService } from './settings.service'

export function initSettingsRoute(service: SettingsService) {
	return new Elysia({ prefix: '/settings' }).get(
		'/summary',
		async function summary() {
			return res.ok(await service.getSettingsSummary())
		},
		{ response: createSuccessResponseSchema(SettingsSummaryDto) },
	)
}

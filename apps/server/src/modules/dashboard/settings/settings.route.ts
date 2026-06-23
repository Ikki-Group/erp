import { createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { res } from '@/shared/http/response'

import { SettingsSummaryDto } from './settings.contract'
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

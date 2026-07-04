import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import { SettingsSummaryDto } from './settings.contract'
import type { SettingsModule } from './settings.module'

export function createSettingsRoute(m: SettingsModule) {
	return new Elysia({ prefix: '/settings' })
		.use(authPluginMacro)
		.get(
			'/summary',
			async function summary() {
				const result = await m.handleGetSummary()
				return res.ok(result)
			},
			{
				response: createSuccessResponseDto(SettingsSummaryDto),
				auth: true,
			},
		)
}

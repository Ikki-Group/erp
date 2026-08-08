import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import { CompanySettingsCreateDto, CompanySettingsUpdateDto } from './company.contract.ts'
import type { CompanyService } from './company.service.ts'

// ─── Route Factory ───

export function createCompanyRoute(service: CompanyService) {
	return new Elysia({ prefix: '/company' })
		.use(authPluginMacro)
		.get('/detail', async () => {
			const result = await service.handleGetSettings()
			return res.ok(result)
		})
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth)
				return res.created(result)
			},
			{ body: CompanySettingsCreateDto },
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth)
				return res.ok(result)
			},
			{ body: CompanySettingsUpdateDto },
		)
}

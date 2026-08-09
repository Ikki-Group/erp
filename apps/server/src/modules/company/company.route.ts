import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	CompanySettingsCreateDto,
	CompanySettingsDto,
	CompanySettingsUpdateDto,
} from './company.contract.ts'
import type { CompanyService } from './company.service.ts'

// ─── Route Factory ───

export function createCompanyRoute(service: CompanyService) {
	return new Elysia({ prefix: '/company', tags: ['company'] })
		.use(authPluginMacro)
		.get(
			'/detail',
			async () => {
				const result = await service.handleGetSettings()
				return res.ok(result)
			},
			{ response: zRes.ok(CompanySettingsDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth)
				return res.created(result)
			},
			{ body: CompanySettingsCreateDto, response: zRes.created(EntityRefDto) },
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth)
				return res.ok(result)
			},
			{ body: CompanySettingsUpdateDto, response: zRes.ok(EntityRefDto) },
		)
}

import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import { CompanySettingsDto, CompanySettingsUpdateDto } from './company.contract.ts'
import type { CompanyService } from './company.service.ts'

export function createCompanyRoute(service: CompanyService) {
	return new Elysia({ prefix: '/company', tags: ['company'] })
		.use(rbac.as('scoped'))
		.get('/settings', async () => res.ok(await service.handleGetSettings()), {
			response: zRes.ok(CompanySettingsDto),
			permission: 'company.read',
		})
		.put('/settings', async ({ body, auth }) => res.ok(await service.handleUpdate(body, auth)), {
			body: CompanySettingsUpdateDto,
			response: zRes.ok(EntityRefDto),
			permission: 'company.update',
		})
}

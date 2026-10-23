import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import { CompanySettingsDto, CompanySettingsUpdateDto } from './company.contract.ts'
import type { CompanyService } from './company.service.ts'
import { createOverviewRoute } from './overview/overview.route.ts'
import type { OverviewService } from './overview/overview.service.ts'

export function createCompanyRoute(service: CompanyService, overview: OverviewService) {
	return new Elysia({ prefix: '/company', tags: ['Company'] })
		.use(rbac.as('scoped'))
		.use(createOverviewRoute(overview))
		.get('/settings', async () => res.ok(await service.handleGetSettings()), {
			response: zRes.ok(CompanySettingsDto),
			permission: 'company.read',
			detail: { summary: 'Get company settings' },
		})
		.put('/settings', async ({ body, actor }) => res.ok(await service.handleUpdate(body, actor)), {
			body: CompanySettingsUpdateDto,
			response: zRes.ok(EntityRefDto),
			permission: 'company.update',
			detail: { summary: 'Update company settings' },
		})
}

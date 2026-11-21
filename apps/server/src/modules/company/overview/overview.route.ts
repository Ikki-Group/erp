import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'

import { CompanyOverviewDto } from './overview.contract.ts'
import type { OverviewService } from './overview.service.ts'

/** Mounted inside the `/company` route group. */
export function createOverviewRoute(service: OverviewService) {
	return new Elysia()
		.use(rbac.as('scoped'))
		.get('/overview', async ({ actor }) => res.ok(await service.handleGet(actor)), {
			response: zRes.ok(CompanyOverviewDto),
			permission: 'company.read',
			detail: { summary: 'Get the company overview' },
		})
}

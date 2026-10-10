import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import { CompanySettingsDto, CompanySettingsUpdateDto } from './company.contract.ts'
import type { CompanyService } from './company.service.ts'

export function createCompanyRoute(service: CompanyService) {
	return new Elysia({ prefix: '/company', tags: ['company'] })
		.use(authGuard)
		.get('/settings', async () => res.ok(await service.handleGetSettings()), {
			response: zRes.ok(CompanySettingsDto),
			permission: 'company.read',
		})
		.put(
			'/settings',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, actorOf(auth))),
			{
				body: CompanySettingsUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'company.update',
			},
		)
}

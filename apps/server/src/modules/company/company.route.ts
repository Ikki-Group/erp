import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@ikki/contract/http'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@ikki/contract/schema'

import { CompanySettingsDto, CompanySettingsUpdateDto } from '@ikki/contract/company'
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

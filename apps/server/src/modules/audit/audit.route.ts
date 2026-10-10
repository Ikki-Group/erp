import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { zRes } from '@ikki/contract/http'
import { res } from '@/shared/http/response.ts'
import { zq } from '@ikki/contract/schema'

import {
	AuditByEntityDto,
	AuditLogDetailDto,
	AuditLogDto,
	AuditLogFilterDto,
} from '@ikki/contract/audit'
import { AuditError } from './audit.internal.ts'
import type { AuditRepo } from './audit.repo.ts'

export function createAuditRoute(repo: AuditRepo) {
	return new Elysia({ prefix: '/audit', tags: ['audit'] })
		.use(authGuard)
		.get('/list', async ({ query }) => res.paginated(await repo.findPage(query)), {
			query: AuditLogFilterDto,
			response: zRes.paginated(AuditLogDto),
			permission: 'audit.read',
		})
		.get(
			'/detail',
			async ({ query }) => {
				const entry = await repo.findById(query.id)
				if (!entry) throw AuditError.notFound(query.id)
				return res.ok(entry)
			},
			{ query: zq.recordId, response: zRes.ok(AuditLogDetailDto), permission: 'audit.read' },
		)
		.get(
			'/by-entity',
			async ({ query }) => res.ok(await repo.findByEntity(query.entity, query.entityId)),
			{
				query: AuditByEntityDto,
				response: zRes.ok(z.array(AuditLogDto)),
				permission: 'audit.read',
			},
		)
}

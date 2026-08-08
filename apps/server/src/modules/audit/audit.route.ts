import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import { AuditByEntityDto, AuditLogFilterDto } from './audit.contract.ts'

import type { AuditService } from './audit.service.ts'

// ─── Route Factory ───

export function createAuditRoute(service: AuditService) {
	return new Elysia({ prefix: '/audit' })
		.use(authPluginMacro)
		.get('/list', async ({ query, auth }) => {
			const result = await service.handleList(query, auth)
			return res.paginated(result)
		}, { query: AuditLogFilterDto })
		.get('/detail', async ({ query, auth }) => {
			const result = await service.handleDetail(query.id, auth)
			return res.ok(result)
		}, { query: zq.recordId })
		.get('/by-entity', async ({ query, auth }) => {
			const result = await service.handleByEntity(query.entity, query.entityId, auth)
			return res.ok(result)
		}, { query: AuditByEntityDto })
}

import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import {
	AuditByEntityDto,
	AuditLogCursorFilterDto,
	AuditLogDetailDto,
	AuditLogDto,
	AuditLogFilterDto,
} from './audit.contract.ts'
import type { AuditService } from './audit.service.ts'

// ─── Route Factory ───

export function createAuditRoute(service: AuditService) {
	return new Elysia({ prefix: '/audit', tags: ['audit'] })
		.use(rbac.as('scoped'))
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: AuditLogFilterDto, response: zRes.paginated(AuditLogDto), permission: 'audit.read' },
		)
		.get(
			'/list/cursor',
			async ({ query }) => {
				const result = await service.handleCursorList(query)
				return res.cursorPaginated(result)
			},
			{
				query: AuditLogCursorFilterDto,
				response: zRes.cursorPaginated(AuditLogDto),
				permission: 'audit.read',
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: zRes.ok(AuditLogDetailDto), permission: 'audit.read' },
		)
		.get(
			'/by-entity',
			async ({ query }) => {
				const result = await service.handleByEntity(query.entity, query.entityId)
				return res.ok(result)
			},
			{
				query: AuditByEntityDto,
				response: zRes.ok(z.array(AuditLogDto)),
				permission: 'audit.read',
			},
		)
}

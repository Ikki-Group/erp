import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/core/validation'

import * as dto from './audit-log.dto'
import type { AuditLogService } from './audit-log.service'

export function initAuditLogRoute(service: AuditLogService) {
	return new Elysia({ prefix: '/audit-log' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.AuditLogFilterDto,
				response: createPaginatedResponseSchema(dto.AuditLogDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.AuditLogDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.AuditLogCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}

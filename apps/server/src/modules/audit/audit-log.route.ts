import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import { AuditLogDto, AuditLogFilterDto, AuditLogCreateDto } from './audit-log.contract'
import type { AuditLogModule } from './audit-log.module'

export function createAuditLogRoute(m: AuditLogModule) {
	return new Elysia({ prefix: '/audit-log' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: AuditLogFilterDto,
				response: createPaginatedResponseDto(AuditLogDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(AuditLogDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate({ ...body, userId: auth.userId })
				return res.created(result)
			},
			{
				body: AuditLogCreateDto.omit({ userId: true }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import {
	createPaginatedResponseDto,
	createSuccessResponseDto,
	zc,
	zq,
} from '@/shared/schema/response'

import { AuditLogDto, AuditLogFilterDto, AuditLogCreateDto } from './audit-log.contract'
import type { AuditLogService } from './audit-log.service'

export function initAuditLogRoute(service: AuditLogService) {
	return new Elysia({ prefix: '/audit-log' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
				return res.created(result)
			},
			{
				body: AuditLogCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

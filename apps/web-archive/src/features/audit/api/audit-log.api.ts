import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/lib/validation'

import { AuditLogDto, AuditLogCreateDto, AuditLogFilterDto } from '../dto'

export const auditLogApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.audit.log.list,
		params: AuditLogFilterDto,
		result: createPaginatedResponseSchema(AuditLogDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.audit.log.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(AuditLogDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.audit.log.create,
		body: AuditLogCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
}

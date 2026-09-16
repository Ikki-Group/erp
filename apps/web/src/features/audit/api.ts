import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineQuery } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation/index.ts'

import { AuditByEntityDto, AuditLogDetailDto, AuditLogDto, AuditLogFilterDto } from './dto/index.ts'

// ─── Queries ───

const auditList = defineQuery({
	method: 'get',
	url: endpoint.audit.list,
	query: AuditLogFilterDto,
	result: createPaginatedResponseSchema(AuditLogDto),
	queryKey: (query) => [endpoint.audit.list, query ?? null],
})

const auditDetail = defineQuery({
	method: 'get',
	url: endpoint.audit.detail,
	query: z.object({ id: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(AuditLogDetailDto),
	queryKey: (query) => [endpoint.audit.detail, query ?? null],
})

/** Chronological audit trail for a single entity — the source for the AuditTrail Timeline. */
const auditByEntity = defineQuery({
	method: 'get',
	url: endpoint.audit.byEntity,
	query: AuditByEntityDto,
	result: createSuccessResponseSchema(z.array(AuditLogDto)),
	queryKey: (query) => [endpoint.audit.byEntity, query ?? null],
})

export const auditResource = {
	list: auditList,
	detail: auditDetail,
	byEntity: auditByEntity,
}

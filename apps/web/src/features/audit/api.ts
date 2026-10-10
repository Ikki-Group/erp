import { zRes } from '@ikki/contract/http'
import { zq } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineQuery } from '@/lib/api/index.ts'

import { AuditByEntityDto, AuditLogDetailDto, AuditLogDto, AuditLogFilterDto } from './dto/index.ts'

const keys = createResourceKeys('audit', 'log')

// ─── Queries ───
const auditList = defineQuery({
	method: 'get',
	url: endpoint.audit.list,
	query: AuditLogFilterDto,
	result: zRes.paginated(AuditLogDto),
	queryKey: (query) => keys.list(query),
})

const auditDetail = defineQuery({
	method: 'get',
	url: endpoint.audit.detail,
	query: zq.recordId,
	result: zRes.ok(AuditLogDetailDto),
	queryKey: (query) => keys.detail(query),
})

/** Chronological audit trail for a single entity — the source for the AuditTrail Timeline. */
const auditByEntity = defineQuery({
	method: 'get',
	url: endpoint.audit.byEntity,
	query: AuditByEntityDto,
	result: zRes.ok(z.array(AuditLogDto)),
	queryKey: (query) => keys.list({ byEntity: query }),
})

export const auditResource = {
	list: auditList,
	detail: auditDetail,
	byEntity: auditByEntity,
}

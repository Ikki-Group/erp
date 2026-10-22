import { z } from 'zod'

import { listSearchSchema } from '@/components/data-table'

import type { AuditLogFilterDto } from './dto/index.ts'

const isoTimestamp = z.string().datetime({ offset: true }).optional().catch(undefined)

/**
 * URL search for the audit log. Server order is fixed (timestamp/id descending),
 * so `sort` is not part of the URL. `id` is UI selection (the open detail
 * dialog), never a server filter.
 */
export const auditSearchSchema = listSearchSchema.omit({ sort: true }).extend({
	module: z.string().trim().optional(),
	action: z.string().trim().optional(),
	dateFrom: isoTimestamp,
	dateTo: isoTimestamp,
	id: z.coerce.number().int().positive().optional().catch(undefined),
})

export type AuditSearch = z.infer<typeof auditSearchSchema>

/** Project URL search onto the list endpoint query; excludes UI selection (`id`). */
export function toAuditListQuery(search: AuditSearch): AuditLogFilterDto {
	return {
		page: search.page,
		limit: search.pageSize,
		q: search.q,
		module: search.module,
		action: search.action,
		dateFrom: search.dateFrom,
		dateTo: search.dateTo,
	}
}

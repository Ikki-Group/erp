/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'

import { auditLogsTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	stampCreate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/infra/database'

import type { ActorId, EntityRef } from '@/types/utils'

import {
	AuditLogSchema,
	type AuditLogFilterSchema,
	type AuditLogCreateSchema,
} from './audit-log.schema'

export class AuditLogRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: AuditLogFilterSchema,
	): Promise<WithPaginationResult<AuditLogSchema>> {
		const { q, page, limit, action, entityType, userId, fromDate, toDate } = filter
		const where = and(
			q === undefined ? undefined : searchFilter(auditLogsTable.description, q),
			action === undefined
				? undefined
				: eq(
						auditLogsTable.action,
						action as any as 'CREATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER' | 'UPDATE',
					),
			entityType === undefined ? undefined : eq(auditLogsTable.entityType, entityType),
			userId === undefined ? undefined : eq(auditLogsTable.userId, userId),
			fromDate === undefined ? undefined : gte(auditLogsTable.actionAt, fromDate),
			toDate === undefined ? undefined : lte(auditLogsTable.actionAt, toDate),
		)

		return paginate({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(auditLogsTable)
					.where(where)
					.orderBy(desc(auditLogsTable.actionAt))
					.limit(limit)
					.offset(offset),
			pq: { page, limit },
			countQuery: this.db.select({ count: count() }).from(auditLogsTable).where(where),
		})
	}

	async getById(id: number): Promise<AuditLogSchema | undefined> {
		const res = await this.db
			.select()
			.from(auditLogsTable)
			.where(eq(auditLogsTable.id, id))
			.limit(1)
			.then(takeFirst)

		return res ?? undefined
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: AuditLogCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(auditLogsTable)
			.values({ ...data, ...metadata })
			.returning({ id: auditLogsTable.id })

		return { id: res?.id ?? 0 }
	}
}

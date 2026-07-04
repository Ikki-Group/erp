import { and, count, desc, eq, gte, lte, SQL } from 'drizzle-orm'

import { auditLogsTable } from '@/db/schema'

import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { AuditLogDto, AuditLogFilterDto, AuditLogCreateDto } from './audit-log.contract'

export interface IAuditLogRepo {
	readonly db: DbContext
	findPage(filter: AuditLogFilterDto, db?: DbContext): Promise<WithPaginationResult<AuditLogDto>>
	findById(id: number, db?: DbContext): Promise<AuditLogDto | undefined>
	insert(data: AuditLogCreateDto, db?: DbContext): Promise<EntityRef | undefined>
}

export class AuditLogRepo implements IAuditLogRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: AuditLogFilterDto): SQL | undefined {
		const { q, action, entityType, userId, fromDate, toDate } = filter
		return and(
			q === undefined ? undefined : searchFilter(auditLogsTable.description, q),
			action === undefined || action === null ? undefined : eq(auditLogsTable.action, action),
			entityType === undefined ? undefined : eq(auditLogsTable.entityType, entityType),
			userId === undefined ? undefined : eq(auditLogsTable.userId, userId),
			fromDate === undefined ? undefined : gte(auditLogsTable.actionAt, fromDate),
			toDate === undefined ? undefined : lte(auditLogsTable.actionAt, toDate),
		)
	}

	async findPage(
		filter: AuditLogFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<AuditLogDto>> {
		const where = this.#buildWhere(filter)

		return paginate<AuditLogDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(auditLogsTable)
					.where(where)
					.orderBy(desc(auditLogsTable.actionAt))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(auditLogsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<AuditLogDto | undefined> {
		return db
			.select()
			.from(auditLogsTable)
			.where(eq(auditLogsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async insert(data: AuditLogCreateDto, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(auditLogsTable)
			.values({
				userId: data.userId,
				action: data.action,
				entityType: data.entityType,
				entityId: data.entityId ?? null,
				description: data.description,
				oldValue: data.oldValue ?? null,
				newValue: data.newValue ?? null,
				ipAddress: data.ipAddress ?? null,
				userAgent: data.userAgent ?? null,
			})
			.returning({ id: auditLogsTable.id })

		return res
	}
}

import { gte, lte } from 'drizzle-orm'

import { auditLogs } from '@/db/schema/audit.ts'

import {
	allOf,
	eqIf,
	searchFilter,
	sql,
	toLimitOffset,
	buildPaginationMeta,
	takeFirst,
	desc,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { AuditLogDetailDto, AuditLogDto, AuditLogFilterDto } from './audit.contract.ts'

// ─── Types ───

type AuditLogRow = typeof auditLogs.$inferSelect

/** Maps a raw DB row to the list DTO shape. */
function toDto(row: AuditLogRow): AuditLogDto {
	return {
		id: row.id,
		timestamp: row.timestamp,
		userId: row.userId,
		userName: row.userName,
		locationId: row.locationId,
		module: row.module,
		entity: row.entity,
		entityId: row.entityId,
		action: row.action,
		summary: row.summary,
	}
}

/** Maps a raw DB row to the detail DTO shape (includes JSON fields). */
function toDetailDto(row: AuditLogRow): AuditLogDetailDto {
	return {
		...toDto(row),
		oldValues: row.oldValues ?? null,
		newValues: row.newValues ?? null,
		metadata: row.metadata ?? null,
	}
}

// ─── Interface ───

export interface IAuditRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<AuditLogDetailDto | undefined>
	findPage(filter: AuditLogFilterDto, db?: DbContext): Promise<WithPaginationResult<AuditLogDto>>
	findByEntity(entity: string, entityId: number, db?: DbContext): Promise<AuditLogDto[]>
}

// ─── Implementation ───

export class AuditRepo implements IAuditRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<AuditLogDetailDto | undefined> {
		const row = await db
			.select()
			.from(auditLogs)
			.where(sql`${auditLogs.id} = ${id}`)
			.limit(1)
			.then(takeFirst)
		return row ? toDetailDto(row) : undefined
	}

	async findPage(
		filter: AuditLogFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<AuditLogDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: auditLogs.id,
				timestamp: auditLogs.timestamp,
				userId: auditLogs.userId,
				userName: auditLogs.userName,
				locationId: auditLogs.locationId,
				module: auditLogs.module,
				entity: auditLogs.entity,
				entityId: auditLogs.entityId,
				action: auditLogs.action,
				summary: auditLogs.summary,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(auditLogs)
			.where(where)
			.orderBy(desc(auditLogs.timestamp))
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => ({
				id: row.id,
				timestamp: row.timestamp,
				userId: row.userId,
				userName: row.userName,
				locationId: row.locationId,
				module: row.module,
				entity: row.entity,
				entityId: row.entityId,
				action: row.action,
				summary: row.summary,
			})),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findByEntity(
		entity: string,
		entityId: number,
		db: DbContext = this.db,
	): Promise<AuditLogDto[]> {
		const rows = await db
			.select()
			.from(auditLogs)
			.where(allOf(eqIf(auditLogs.entity, entity), eqIf(auditLogs.entityId, entityId)))
			.orderBy(desc(auditLogs.timestamp))

		return rows.map(toDto)
	}

	// ─── Private ───

	#buildWhere(filter: AuditLogFilterDto) {
		return allOf(
			eqIf(auditLogs.module, filter.module),
			eqIf(auditLogs.entity, filter.entity),
			eqIf(auditLogs.entityId, filter.entityId),
			eqIf(auditLogs.userId, filter.userId),
			eqIf(auditLogs.action, filter.action),
			filter.dateFrom ? gte(auditLogs.timestamp, filter.dateFrom) : undefined,
			filter.dateTo ? lte(auditLogs.timestamp, filter.dateTo) : undefined,
			searchFilter(auditLogs.summary, filter.q),
		)
	}
}

import { roles, userAssignments } from '@/db/schema/iam.ts'

import {
	and,
	eq,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { AssignmentDto, AssignmentFilterDto } from './assignment.contract.ts'
import type { SQL } from 'drizzle-orm'

// ─── Types ───

type AssignmentInsert = typeof userAssignments.$inferInsert
type AssignmentRow = typeof userAssignments.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: AssignmentRow): AssignmentDto {
	return {
		id: row.id,
		userId: row.userId,
		roleId: row.roleId,
		locationId: row.locationId,
	}
}

// ─── Interface ───

export interface IAssignmentRepo {
	readonly db: DbContext
	findByUserId(userId: number, db?: DbContext): Promise<AssignmentDto[]>
	findPage(
		filter: AssignmentFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<AssignmentDto>>
	findExact(
		userId: number,
		roleId: number,
		locationId: number | null,
		db?: DbContext,
	): Promise<AssignmentDto | undefined>
	insert(data: AssignmentInsert, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	countOwnerAssignments(db?: DbContext): Promise<number>
}

// ─── Implementation ───

export class AssignmentRepo implements IAssignmentRepo {
	constructor(readonly db: DbContext) {}

	async findByUserId(userId: number, db: DbContext = this.db): Promise<AssignmentDto[]> {
		const rows = await db.select().from(userAssignments).where(eq(userAssignments.userId, userId))
		return rows.map(toDto)
	}

	async findPage(
		filter: AssignmentFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<AssignmentDto>> {
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: userAssignments.id,
				userId: userAssignments.userId,
				roleId: userAssignments.roleId,
				locationId: userAssignments.locationId,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(userAssignments)
			.where(eq(userAssignments.userId, filter.userId))
			.orderBy(sql`${userAssignments.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => ({
				id: row.id,
				userId: row.userId,
				roleId: row.roleId,
				locationId: row.locationId,
			})),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findExact(
		userId: number,
		roleId: number,
		locationId: number | null,
		db: DbContext = this.db,
	): Promise<AssignmentDto | undefined> {
		const conditions: SQL[] = [
			eq(userAssignments.userId, userId),
			eq(userAssignments.roleId, roleId),
		]

		if (locationId === null) {
			conditions.push(sql`${userAssignments.locationId} is null`)
		} else {
			conditions.push(eq(userAssignments.locationId, locationId))
		}

		const row = await db
			.select()
			.from(userAssignments)
			.where(and(...conditions))
			.limit(1)
			.then(takeFirst)

		return row ? toDto(row) : undefined
	}

	async insert(data: AssignmentInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(userAssignments)
			.values(data)
			.returning({ id: userAssignments.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(userAssignments)
			.where(eq(userAssignments.id, id))
			.returning({ id: userAssignments.id })
		return result
	}

	/**
	 * Count all assignments that reference the owner role.
	 * Used to prevent removal of the last owner assignment.
	 */
	async countOwnerAssignments(db: DbContext = this.db): Promise<number> {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(userAssignments)
			.innerJoin(roles, eq(userAssignments.roleId, roles.id))
			.where(eq(roles.code, 'owner'))

		return Number(result?.count ?? 0)
	}
}

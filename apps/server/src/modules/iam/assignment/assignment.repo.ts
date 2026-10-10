import { isNull } from 'drizzle-orm'

import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import {
	and,
	eq,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import { OWNER_ROLE_CODE } from '@/shared/config/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { AssignmentDto, AssignmentFilterDto } from './assignment.contract.ts'

type AssignmentInsert = typeof userAssignments.$inferInsert

const dtoColumns = {
	id: userAssignments.id,
	userId: userAssignments.userId,
	roleId: userAssignments.roleId,
	locationId: userAssignments.locationId,
}

export class AssignmentRepo {
	constructor(readonly db: DbContext) {}

	findByUserId(userId: number, db: Db = this.db): Promise<AssignmentDto[]> {
		return db.select(dtoColumns).from(userAssignments).where(eq(userAssignments.userId, userId))
	}

	async findPage(
		filter: AssignmentFilterDto,
		db: Db = this.db,
	): Promise<WithPaginationResult<AssignmentDto>> {
		const { limit, offset } = toLimitOffset(filter)
		const rows = await db
			.select({ ...dtoColumns, rowCount: sql<number>`count(*) over()`.as('row_count') })
			.from(userAssignments)
			.where(eq(userAssignments.userId, filter.userId))
			.orderBy(sql`${userAssignments.id} desc`)
			.limit(limit)
			.offset(offset)
		return {
			data: rows.map(({ rowCount: _rowCount, ...row }) => row),
			meta: buildPaginationMeta(filter.page, filter.limit, rows[0]?.rowCount ?? 0),
		}
	}

	findExact(
		userId: number,
		roleId: number,
		locationId: number | null,
		db: Db = this.db,
	): Promise<AssignmentDto | undefined> {
		return db
			.select(dtoColumns)
			.from(userAssignments)
			.where(
				and(
					eq(userAssignments.userId, userId),
					eq(userAssignments.roleId, roleId),
					locationId === null
						? isNull(userAssignments.locationId)
						: eq(userAssignments.locationId, locationId),
				),
			)
			.limit(1)
			.then(takeFirst)
	}

	/** Serializes assignment changes for one user until the transaction ends. */
	async lockUser(userId: number, db: Db = this.db): Promise<void> {
		await db.execute(sql`select pg_advisory_xact_lock(${userId})`)
	}

	async userExists(userId: number, db: Db = this.db): Promise<boolean> {
		const row = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)
			.then(takeFirst)
		return row !== undefined
	}

	async findRoleCode(roleId: number, db: Db = this.db): Promise<string | undefined> {
		const row = await db
			.select({ code: roles.code })
			.from(roles)
			.where(eq(roles.id, roleId))
			.limit(1)
			.then(takeFirst)
		return row?.code
	}

	async insert(data: AssignmentInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(userAssignments)
			.values(data)
			.returning({ id: userAssignments.id })
		return result
	}

	async remove(id: number, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(userAssignments)
			.where(eq(userAssignments.id, id))
			.returning({ id: userAssignments.id })
		return result
	}

	/** Used to prevent removal of the last owner assignment. */
	async countOwnerAssignments(db: Db = this.db): Promise<number> {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(userAssignments)
			.innerJoin(roles, eq(userAssignments.roleId, roles.id))
			.where(eq(roles.code, OWNER_ROLE_CODE))
		return Number(result?.count ?? 0)
	}
}

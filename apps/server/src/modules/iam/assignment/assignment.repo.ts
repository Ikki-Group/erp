import { eq, inArray, and, type SQL } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { type DbContext } from '@/infra/database'
import { toArray } from '@/shared/utils'

import type { UserAssignmentDto } from './assignment.contract'

interface FindManyOpts {
	userIds?: number | number[]
	roleIds?: number | number[]
	locationIds?: number | number[]
}

export class UserAssignmentRepo {
	constructor(private readonly db: DbContext) {}

	async findMany(opts: FindManyOpts = {}, db = this.db): Promise<UserAssignmentDto[]> {
		const { userIds, roleIds, locationIds } = opts
		const where: SQL[] = []

		if (userIds) where.push(inArray(userAssignmentsTable.userId, toArray(userIds)))
		if (roleIds) where.push(inArray(userAssignmentsTable.roleId, toArray(roleIds)))
		if (locationIds) where.push(inArray(userAssignmentsTable.locationId, toArray(locationIds)))

		return db
			.select()
			.from(userAssignmentsTable)
			.where(where.length > 0 ? and(...where) : undefined)
	}

	/**
	 * Replaces all assignments for the specified user.
	 */
	async replaceByUserId(
		userId: number,
		assignments: Omit<UserAssignmentDto, 'id'>[],
		db = this.db,
	): Promise<void> {
		await db.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

		if (assignments.length === 0) {
			return
		}

		await db.insert(userAssignmentsTable).values(assignments)
	}
}

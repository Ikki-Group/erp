import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull } from 'drizzle-orm'

import { paginate, stampCreate, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { userAssignmentsTable } from '@/db/schema'

import * as dto from '../dto'
import type { OmitPaginationQuery } from '@/types/utils'

export class UserAssignmentRepo {
	/* -------------------------------------------------------------------------- */
	/*                                    QUERY                                   */
	/* -------------------------------------------------------------------------- */

	async getList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentRepo.getList', async () => {
			const { userId, roleId, locationId } = filter
			const where = and(
				isNull(userAssignmentsTable.deletedAt),
				userId ? eq(userAssignmentsTable.userId, userId) : undefined,
				roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
				locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
			)

			return db
				.select()
				.from(userAssignmentsTable)
				.where(where)
				.orderBy(userAssignmentsTable.updatedAt)
		})
	}

	async getListPaginated(
		filter: dto.UserAssignmentFilterDto,
	): Promise<WithPaginationResult<dto.UserAssignmentDto>> {
		return record('UserAssignmentRepo.getListPaginated', async () => {
			const { userId, roleId, locationId, page, limit } = filter
			const where = and(
				isNull(userAssignmentsTable.deletedAt),
				userId ? eq(userAssignmentsTable.userId, userId) : undefined,
				roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
				locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
			)

			return paginate<dto.UserAssignmentDto>({
				data: ({ limit: l, offset }) => {
					const rows = db
						.select()
						.from(userAssignmentsTable)
						.where(where)
						.orderBy(userAssignmentsTable.updatedAt)
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(userAssignmentsTable).where(where),
			})
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

	async upsertBulk(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentRepo.upsertBulk', async () => {
			// Delete all existing assignments for this user.
			await db.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

			if (assignments.length > 0) {
				// Insert new assignments.
				const stamps = stampCreate(actorId)
				await db
					.insert(userAssignmentsTable)
					.values(assignments.map((a) => ({ ...a, userId, ...stamps })))
			}
		})
	}

	async remove(userId: number, locationId: number): Promise<void> {
		return record('UserAssignmentRepo.remove', async () => {
			await db
				.delete(userAssignmentsTable)
				.where(
					and(
						eq(userAssignmentsTable.userId, userId),
						eq(userAssignmentsTable.locationId, locationId),
					),
				)
		})
	}
}

import { record } from '@elysiajs/opentelemetry'
import { eq, getColumns, and, count, isNull } from 'drizzle-orm'

import { cache } from '@/core/cache'
import * as core from '@/core/database'
import { db } from '@/db'
import { locationsTable, rolesTable, userAssignmentsTable } from '@/db/schema'

import * as dto from '../dto/assignment.dto'

const cacheKey = { byUser: (userId: number) => `iam.user-assignment.user.${userId}` }

// User Assignment Service (Layer 0)
// Handles the mapping between Users, Roles, and Locations.
export class UserAssignmentService {
	// Returns detailed assignments for a user.
	async findByUserId(userId: number): Promise<dto.UserAssignmentDetailDto[]> {
		return record('UserAssignmentService.findByUserId', async () => {
			return cache.wrap(cacheKey.byUser(userId), async () => {
				const rows = await db
					.select({
						...getColumns(userAssignmentsTable),
						role: rolesTable,
						roleName: rolesTable.name,
						roleCode: rolesTable.code,
						locationName: locationsTable.name,
						locationCode: locationsTable.code,
					})
					.from(userAssignmentsTable)
					.innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
					.innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
					.where(eq(userAssignmentsTable.userId, userId))

				console.log({ rows })
				return rows
			})
		})
	}

	// Paginated list with filtering (Layer 1).
	async handleList(
		filter: dto.UserAssignmentFilterDto,
	): Promise<core.WithPaginationResult<dto.UserAssignmentDetailDto>> {
		return record('UserAssignmentService.handleList', async () => {
			const { userId, roleId, locationId, page, limit } = filter
			const where = and(
				isNull(userAssignmentsTable.deletedAt),
				userId ? eq(userAssignmentsTable.userId, userId) : undefined,
				roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
				locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
				isNull(rolesTable.deletedAt),
				isNull(locationsTable.deletedAt),
			)

			return core.paginate<dto.UserAssignmentDetailDto>({
				data: async ({ limit: l, offset }) => {
					const rows = await db
						.select({
							...getColumns(userAssignmentsTable),
							roleName: rolesTable.name,
							roleCode: rolesTable.code,
							locationName: locationsTable.name,
							locationCode: locationsTable.code,
						})
						.from(userAssignmentsTable)
						.innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
						.innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
						.where(where)
						.orderBy(core.sortBy(userAssignmentsTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows
				},
				pq: { page, limit },
				countQuery: db
					.select({ count: count() })
					.from(userAssignmentsTable)
					.innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
					.innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
					.where(where),
			})
		})
	}

	// Atomically replaces all assignments for a user.
	async handleUpsertBulk(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		await record('UserAssignmentService.handleUpsertBulk', async () => {
			await db.transaction(async (tx) => {
				// Delete all existing assignments for this user.
				await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

				if (assignments.length > 0) {
					// Insert new assignments.
					await tx
						.insert(userAssignmentsTable)
						.values(assignments.map((a) => ({ ...a, userId, ...core.stampCreate(actorId) })))
				}
			})
			await this.clearCache(userId)
		})
	}

	// Assigns a user to a specific location with a role.
	async handleAssign(
		data: { userId: number; locationId: number; roleId: number },
		actorId: number,
	): Promise<void> {
		await record('UserAssignmentService.handleAssign', async () => {
			const { userId, locationId, roleId } = data

			// Check if assignment already exists
			const existing = await db
				.select()
				.from(userAssignmentsTable)
				.where(
					and(
						eq(userAssignmentsTable.userId, userId),
						eq(userAssignmentsTable.locationId, locationId),
						eq(userAssignmentsTable.roleId, roleId),
					),
				)

			if (existing.length > 0) return

			await db
				.insert(userAssignmentsTable)
				.values({ userId, locationId, roleId, isDefault: false, ...core.stampCreate(actorId) })

			await this.clearCache(userId)
		})
	}

	// Removes a user assignment from a specific location.
	async handleRemove(userId: number, locationId: number): Promise<void> {
		await record('UserAssignmentService.handleRemove', async () => {
			await db
				.delete(userAssignmentsTable)
				.where(
					and(
						eq(userAssignmentsTable.userId, userId),
						eq(userAssignmentsTable.locationId, locationId),
					),
				)

			await this.clearCache(userId)
		})
	}

	// Clear relevant caches.
	private async clearCache(userId: number) {
		await cache.del(cacheKey.byUser(userId))
	}
}

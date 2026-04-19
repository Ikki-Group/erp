import { record } from '@elysiajs/opentelemetry'
import { eq, getColumns, and, count, isNull } from 'drizzle-orm'

import { bento } from '@/core/cache'
import * as core from '@/core/database'

import { db } from '@/db'
import { locationsTable, rolesTable, userAssignmentsTable } from '@/db/schema'

import type { LocationService } from '@/modules/location/service'

import * as dto from '../dto/assignment.dto'
import type { RoleService } from './role.service'

const cache = bento.namespace('user-assignment')

// User Assignment Service (Layer 0)
// Handles the mapping between Users, Roles, and Locations.
// Sole owner of `userAssignmentsTable` — no other service may write to this table.
export class UserAssignmentService {
	constructor(
		private locationService: LocationService,
		private roleService: RoleService,
	) {}

	// Returns detailed assignments for a user.
	async findByUserId(userId: number): Promise<dto.UserAssignmentDetailDto[]> {
		return record('UserAssignmentService.findByUserId', async () => {
			return cache.getOrSet({
				key: `user.${userId}`,
				factory: async () => {
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
						.where(eq(userAssignmentsTable.userId, userId))

					return rows
				},
			})
		})
	}

	/**
	 * Resolves all locations as synthetic assignments for root users.
	 * Root users do not have assignment rows in DB —
	 * locations are resolved at runtime from LocationService + RoleService.
	 */
	async resolveRootAssignments(userId: number): Promise<dto.UserAssignmentDetailDto[]> {
		const [allLocations, allRoles] = await Promise.all([
			this.locationService.find(),
			this.roleService.find(),
		])

		// Find the SUPERADMIN role (isSystem + permissions: ['*'])
		const superAdminRole = allRoles.find((r) => r.isSystem && r.permissions.includes('*'))
		if (!superAdminRole) return []

		return allLocations.map(
			(loc, idx) =>
				({
					id: 0, // Synthetic ID
					userId,
					roleId: superAdminRole.id,
					locationId: loc.id,
					isDefault: idx === 0,
					roleName: superAdminRole.name,
					roleCode: superAdminRole.code,
					locationName: loc.name,
					locationCode: loc.code,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 0,
					updatedBy: 0,
					deletedAt: null,
					deletedBy: null,
				}) satisfies dto.UserAssignmentDetailDto,
		)
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

	// Internal: Atomically replaces all assignments for a user.
	// Used by other services (e.g. UserService) to delegate assignment writes.
	async execUpsertBulk(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		await record('UserAssignmentService.execUpsertBulk', async () => {
			// Delete all existing assignments for this user.
			await db.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

			if (assignments.length > 0) {
				// Insert new assignments.
				await db
					.insert(userAssignmentsTable)
					.values(assignments.map((a) => ({ ...a, userId, ...core.stampCreate(actorId) })))
			}

			await this.clearCache(userId)
		})
	}

	// Internal: Assigns a user to a specific location with a role.
	async execAssign(
		data: { userId: number; locationId: number; roleId: number },
		actorId: number,
	): Promise<void> {
		await record('UserAssignmentService.execAssign', async () => {
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

	// Internal: Removes a user assignment from a specific location.
	async execRemove(userId: number, locationId: number): Promise<void> {
		await record('UserAssignmentService.execRemove', async () => {
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
		await cache.deleteMany({ keys: [`user.${userId}`] })
	}
}

import { record } from '@elysiajs/opentelemetry'

import * as core from '@/core/database'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { RelationMap } from '@/core/utils/relation-map'
import type { AuditResolved } from '@/core/validation'

import type { LocationDto } from '@/modules/location'
import type { LocationMasterService } from '@/modules/location/service'

import type { RoleDto } from '../dto'
import * as dto from '../dto/user.dto'
import { UserErrors } from '../errors'

import type { UserAssignmentService } from '../service/assignment.service'
import type { RoleService } from '../service/role.service'
import type { UserService } from '../service/user.service'

// User Usecases
// Cross-module orchestration layer — combines User + Role + Assignment + Location
// This exists because user operations need data from external modules (Location)
export class UserUsecases {
	constructor(
		private userService: UserService,
		private roleService: RoleService,
		private assignmentService: UserAssignmentService,
		private locationService: LocationMasterService,
	) {}

	/* ========================================================================== */
	/*                              PRIVATE HELPERS                              */
	/* ========================================================================== */

	private async getUserAssignments(
		user: dto.UserDto,
		roleMapper?: RelationMap<number, RoleDto>,
		locationMapper?: RelationMap<number, LocationDto>,
	): Promise<dto.UserAssignmentDetailDto[]> {
		return record('UserUsecases.getUserAssignments', async () => {
			const assignments: dto.UserAssignmentDetailDto[] = []
			const { id: userId, isRoot, defaultLocationId } = user

			if (isRoot) {
				const [superadmin, locations] = await Promise.all([
					this.roleService.getSuperadmin(),
					this.locationService.getList(),
				])

				const defaultAssignment = this.assignmentService.getDefaultAssignmentForSuperadmin()
				for (const location of locations) {
					assignments.push({
						...defaultAssignment,
						isDefault: false,
						role: superadmin,
						location,
					})
				}
			} else {
				const [rawAssignments, roleMap, locationMap] = await Promise.all([
					this.assignmentService.findByUserId(userId),
					roleMapper ?? this.roleService.getRelationMap(),
					locationMapper ?? this.locationService.getRelationMap(),
				])

				assignments.push(
					...rawAssignments.map((a) => ({
						...a,
						isDefault: false,
						role: roleMap.getRequired(a.roleId),
						location: locationMap.getRequired(a.locationId),
					})),
				)
			}

			if (assignments.length > 0 && defaultLocationId === null && assignments[0]) {
				assignments[0].isDefault = true
			}

			return assignments
		})
	}

	/* ========================================================================== */
	/*                              PUBLIC METHODS                               */
	/* ========================================================================== */

	async getUserDetail(id: number): Promise<dto.UserDetailDto> {
		return record('UserUsecases.getUserDetail', async () => {
			const user = await this.userService.getById(id)
			if (!user) throw UserErrors.notFound(id)
			const assignments = await this.getUserAssignments(user)

			return {
				...user,
				assignments,
			}
		})
	}

	/* ========================================================================== */
	/*                            HANDLER OPERATIONS                             */
	/* ========================================================================== */

	async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
		return record('UserUsecases.handleCreate', async () => {
			const { password, assignments, isRoot } = data
			const passwordHash = await Bun.password.hash(password)

			// Create user via service (handles conflict check + cache)
			const { id: insertedId } = await this.userService.handleCreate(
				{ ...data, passwordHash },
				actorId,
			)

			// Assign to locations if provided and not a root user
			if (assignments && assignments.length > 0 && !isRoot) {
				const assignmentsWithUserId = assignments.map((a) => ({
					userId: insertedId,
					roleId: a.roleId,
					locationId: a.locationId,
				}))
				await this.assignmentService.handleReplaceBulkByUserId(
					insertedId,
					assignmentsWithUserId,
					actorId,
				)
			}

			return { id: insertedId }
		})
	}

	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserUsecases.handleUpdate', async () => {
			const { assignments, password, isRoot } = data
			const passwordHash = password ? await Bun.password.hash(password) : undefined

			// Update user via service (handles conflict check + cache)
			await this.userService.handleUpdate(
				id,
				{ ...data, ...(passwordHash ? { passwordHash } : {}) },
				actorId,
			)

			// Update assignments if provided and not a root user
			if (assignments && assignments.length >= 0 && !isRoot) {
				const assignmentsWithUserId = assignments.map((a) => ({
					userId: id,
					roleId: a.roleId,
					locationId: a.locationId,
				}))
				await this.assignmentService.handleReplaceBulkByUserId(
					id,
					assignmentsWithUserId,
					actorId,
				)
			}

			return { id }
		})
	}

	async handleList(
		filter: dto.UserFilterDto,
	): Promise<core.WithPaginationResult<dto.UserDetailDto>> {
		return record('UserUsecases.handleList', async () => {
			const p = await this.userService.getListPaginated(filter)

			const [roleMap, locationMap] = await Promise.all([
				this.roleService.getRelationMap(),
				this.locationService.getRelationMap(),
			])

			const data = await Promise.all(
				p.data.map(async (d) => {
					const assignments = await this.getUserAssignments(d, roleMap, locationMap)
					return {
						...d,
						assignments,
					}
				}),
			)

			return { ...p, data }
		})
	}

	async handleDetail(id: number): Promise<dto.UserDetailDto & AuditResolved> {
		return record('UserUsecases.handleDetail', async () => {
			const user = await this.getUserDetail(id)
			return resolveAudit(user)
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import * as core from '@/core/database'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { RelationMap } from '@/core/utils/relation-map'
import type { AuditResolved } from '@/core/validation'

import { usersTable } from '@/db/schema'

import type { LocationDto } from '@/modules/location'
import type { LocationMasterService } from '@/modules/location/service'

import type { RoleDto } from '../dto'
import * as dto from '../dto/user.dto'
import { UserErrors } from '../errors'

import type { UserAssignmentService } from '../service/assignment.service'
import type { RoleService } from '../service/role.service'
import type { UserService } from '../service/user.service'

const userConflictFields: core.ConflictField<'email' | 'username'>[] = [
	{
		field: 'email',
		column: usersTable.email,
		message: 'Email already exists',
		code: 'USER_EMAIL_ALREADY_EXISTS',
	},
	{
		field: 'username',
		column: usersTable.username,
		message: 'Username already exists',
		code: 'USER_USERNAME_ALREADY_EXISTS',
	},
]

export class UserUsecases {
	constructor(
		private userService: UserService,
		private roleService: RoleService,
		private assignmentService: UserAssignmentService,
		private locationService: LocationMasterService,
	) {}

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

	async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
		return record('UserUsecases.handleCreate', async () => {
			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
			})

			const { password, assignments, isRoot } = data
			const passwordHash = await Bun.password.hash(password)

			const insertedId = await this.userService.repo.create({ ...data, passwordHash }, actorId)
			if (!insertedId) throw UserErrors.createFailed()

			if (assignments && assignments.length > 0 && !isRoot) {
				const assignmentsWithUserId = assignments.map((a) => ({
					userId: insertedId,
					roleId: a.roleId,
					locationId: a.locationId,
				}))
				await this.assignmentService.repo.replaceBulkByUserId(
					insertedId,
					assignmentsWithUserId,
					actorId,
				)
				await this.assignmentService.invalidateUsersCaches([insertedId])
			}

			await this.userService.clearCache()
			return { id: insertedId }
		})
	}

	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserUsecases.handleUpdate', async () => {
			const existing = await this.userService.getById(id)
			if (!existing) throw UserErrors.notFound(id)

			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
				existing,
			})

			const { assignments, password, isRoot } = data
			const passwordHash = password ? await Bun.password.hash(password) : undefined

			await this.userService.repo.update({ ...data, id, passwordHash: passwordHash! }, actorId)

			if (assignments && assignments.length >= 0 && !isRoot) {
				const assignmentsWithUserId = assignments.map((a) => ({
					userId: id,
					roleId: a.roleId,
					locationId: a.locationId,
				}))
				await this.assignmentService.repo.replaceBulkByUserId(id, assignmentsWithUserId, actorId)
				await this.assignmentService.invalidateUsersCaches([id])
			}

			await this.userService.clearCache(id)
			return { id }
		})
	}

	async handleAdminUpdatePassword(
		data: dto.UserAdminUpdatePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserUsecases.handleAdminUpdatePassword', async () => {
			const { id, password } = data
			const passwordHash = await Bun.password.hash(password)

			await this.userService.repo.updatePassword(id, passwordHash, actorId)
			await this.userService.clearCache(id)
			return { id }
		})
	}

	async handleChangePassword(
		id: number,
		data: dto.UserChangePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserUsecases.handleChangePassword', async () => {
			const passwordHash = await this.userService.repo.getPasswordHash(id)
			if (!passwordHash) throw UserErrors.notFound(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw UserErrors.passwordMismatch()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			await this.userService.repo.updatePassword(id, newPasswordHash, actorId)

			await this.userService.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('UserUsecases.handleRemove', async () => {
			const result = await this.userService.repo.remove(id)
			if (!result) throw UserErrors.notFound(id)
			await this.userService.clearCache(id)
			return { id: result }
		})
	}

	async handleList(
		filter: dto.UserFilterDto,
	): Promise<core.WithPaginationResult<dto.UserDetailDto>> {
		return record('UserUsecases.handleList', async () => {
			const p = await this.userService.repo.getListPaginated(filter)

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

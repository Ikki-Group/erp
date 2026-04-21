import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import { CACHE_KEY_DEFAULT } from '@/core/cache'
import * as core from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { RelationMap } from '@/core/utils/relation-map'
import type { AuditResolved } from '@/core/validation'

import { usersTable } from '@/db/schema'

import type { LocationDto } from '@/modules/location'
import type { LocationMasterService } from '@/modules/location/service'

import type { RoleDto } from '../dto'
import * as dto from '../dto/user.dto'
import type { UserRepo } from '../repo/user.repo'
import type { UserAssignmentService } from './assignment.service'
import type { RoleService } from './role.service'

const uniqueFields: core.ConflictField<'email' | 'username'>[] = [
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

const cache = bento.namespace('user')

const err = {
	notFound: (id: number) => new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND'),
	createFailed: () => new InternalServerError('User creation failed', 'USER_CREATE_FAILED'),
	oldPasswordMismatch: () =>
		new BadRequestError('Old password does not match', 'USER_OLD_PASSWORD_MISMATCH'),
}

// User Service (Layer 0)
// Handles sensitive identity and profile management.
export class UserService {
	constructor(
		private repo: UserRepo,
		private assignmentService: UserAssignmentService,
		private roleService: RoleService,
		private locationService: LocationMasterService,
	) {}

	// internal
	private async clearCache(id?: number) {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	private validateUserAssignments(
		assignments: dto.UserAssignmentDetailDto[],
	): dto.UserAssignmentDetailDto[] {
		if (assignments.length > 0) {
			const defaultLocationIds = assignments.filter((a) => a.isDefault).map((a) => a.locationId)

			// Set the first location as default.
			if (defaultLocationIds.length === 0) assignments[0]!.isDefault = true

			// Pick one location as default.
			if (defaultLocationIds.length > 1) {
				const [selectedLocationId] = defaultLocationIds
				assignments = assignments.map((a) => ({
					...a,
					isDefault: a.locationId === selectedLocationId,
				}))
			}
		}

		return assignments
	}

	private async getUserAssignments(
		userId: number,
		isRoot: boolean,
		roleMapper?: RelationMap<number, RoleDto>,
		locationMapper?: RelationMap<number, LocationDto>,
	): Promise<dto.UserAssignmentDetailDto[]> {
		return record('UserService.getUserAssignments', async () => {
			const assignments: dto.UserAssignmentDetailDto[] = []

			// Root users: resolve ALL locations at runtime and roles as SUPERADMIN
			if (isRoot) {
				const [superAdminRole, allLocations, userAssignments] = await Promise.all([
					this.roleService.getSuperadmin(),
					this.locationService.getList(),
					this.assignmentService.getList({ userId }),
				])

				const defaultAssignment = this.assignmentService.getDefaultAssignmentForSuperadmin()

				for (const location of allLocations) {
					const userAssignment = userAssignments.find((a) => a.locationId === location.id)
					assignments.push({
						...defaultAssignment,
						userId,
						locationId: location.id,
						isDefault: userAssignment?.isDefault ?? false,
						role: superAdminRole,
						location,
					})
				}
			} else {
				const rawAssignments = await this.assignmentService.findByUserId(userId)
				const roleMap = roleMapper ?? (await this.roleService.getRelationMap())
				const locationMap = locationMapper ?? (await this.locationService.getRelationMap())

				assignments.push(
					...rawAssignments.map((a) => ({
						...a,
						role: roleMap.getRequired(a.roleId),
						location: locationMap.getRequired(a.locationId),
					})),
				)
			}

			return this.validateUserAssignments(assignments)
		})
	}

	// Seed initial users.
	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	): Promise<void> {
		await record('UserService.seed', async () => {
			// for (const d of data) {
			// 	const insertedId = await this.repo.seed([d]).then((res) => res[0])

			// 	if (insertedId && d.assignments && d.assignments.length > 0) {
			// 		await this.assignmentService.execUpsertBulk(insertedId, d.assignments, d.createdBy)
			// 	}
			// }
			await this.clearCache()
		})
	}

	async getList(): Promise<dto.UserDto[]> {
		return record('UserService.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getById(id: number): Promise<dto.UserDto | undefined> {
		return record('UserService.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const row = await this.repo.getById(id)
					return row ?? skip()
				},
			})
		})
	}

	async getUserDetail(id: number): Promise<dto.UserDetailDto> {
		return record('UserService.getUserDetail', async () => {
			const user = await this.getById(id)
			if (!user) throw err.notFound(id)
			const assignments = await this.getUserAssignments(id, user.isRoot)

			return {
				...user,
				assignments,
			}
		})
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(dto.UserDto & { passwordHash: string }) | null> {
		return this.repo.findByIdentifier(identifier)
	}

	async count(): Promise<number> {
		return record('UserService.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: () => this.repo.count(),
			})
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                   HANDLER                                  */
	/* -------------------------------------------------------------------------- */

	// Paginated list.
	async handleList(
		filter: dto.UserFilterDto,
	): Promise<core.WithPaginationResult<dto.UserDetailDto>> {
		return record('UserService.handleList', async () => {
			const p = await this.repo.getListPaginated(filter)

			const roleMap = await this.roleService.getRelationMap()
			const locationMap = await this.locationService.getRelationMap()

			const data = await Promise.all(
				p.data.map(async (d) => {
					const assignments = await this.getUserAssignments(d.id, d.isRoot, roleMap, locationMap)
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
		const user = await this.getUserDetail(id)
		return resolveAudit(user)
	}

	async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
		return record('UserService.handleCreate', async () => {
			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: uniqueFields,
				input: data,
			})

			const { assignments, password } = data
			const passwordHash = await Bun.password.hash(password)

			const insertedId = await this.repo.create({ ...data, passwordHash }, actorId)
			if (!insertedId) throw err.createFailed()

			// Delegate assignment writes to the owner service.
			if (assignments.length > 0) {
				await this.assignmentService.execUpsertBulk(insertedId, assignments, actorId)
			}

			await this.clearCache()
			return { id: insertedId }
		})
	}

	// Update.
	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleUpdate', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: uniqueFields,
				input: { ...data },
				existing,
			})

			const { assignments, password } = data
			const passwordHash = password ? await Bun.password.hash(password) : undefined

			await this.repo.update({ ...data, passwordHash: passwordHash! }, actorId)

			// Delegate assignment writes to the owner service.
			if (assignments) {
				await this.assignmentService.execUpsertBulk(id, assignments, actorId)
			}

			await this.clearCache(id)
			return { id }
		})
	}

	// Administrative password reset.
	async handleAdminUpdatePassword(
		data: dto.UserAdminUpdatePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleAdminUpdatePassword', async () => {
			const { id, password } = data
			const passwordHash = await Bun.password.hash(password)

			await this.repo.updatePassword(id, passwordHash, actorId)

			await this.clearCache(id)
			return { id }
		})
	}

	// Password change for current user.
	async handleChangePassword(
		id: number,
		data: dto.UserChangePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleChangePassword', async () => {
			const passwordHash = await this.repo.getPasswordHash(id)
			if (!passwordHash) throw err.notFound(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw err.oldPasswordMismatch()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			await this.repo.updatePassword(id, newPasswordHash, actorId)

			await this.clearCache(id)
			return { id }
		})
	}

	// Removal.
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('UserService.handleRemove', async () => {
			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id: result }
		})
	}

	// Hard Removal.
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('UserService.handleHardRemove', async () => {
			const result = await this.repo.hardRemove(id)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id: result }
		})
	}
}

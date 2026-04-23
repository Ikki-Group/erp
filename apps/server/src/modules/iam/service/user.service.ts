import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { RelationMap } from '@/core/utils/relation-map'
import type { AuditResolved } from '@/core/validation'
import * as core from '@/core/database'

import type { LocationDto } from '@/modules/location'
import type { LocationMasterService } from '@/modules/location/service'

import {
	UserNotFoundError,
	UserCreateFailedError,
	UserPasswordMismatchError,
} from '../errors'
import { UserValidator } from '../validators'
import { IAM_CACHE_KEYS } from '../constants'
import type { RoleDto } from '../dto'
import * as dto from '../dto/user.dto'
import type { UserRepo } from '../repo/user.repo'
import type { UserAssignmentService } from './assignment.service'
import type { RoleService } from './role.service'

const cache = bento.namespace('user')

// User Service (Layer 1)
// Handles identity, profile, and user assignment management
// Methods organized by QUERY (read) and COMMAND (write) operations
export class UserService {
	constructor(
		private repo: UserRepo,
		private assignmentService: UserAssignmentService,
		private roleService: RoleService,
		private locationService: LocationMasterService,
	) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	private async clearCache(id?: number) {
		const keys = [IAM_CACHE_KEYS.USER_LIST, IAM_CACHE_KEYS.USER_COUNT]
		if (id) keys.push(IAM_CACHE_KEYS.USER_DETAIL(id))
		await cache.deleteMany({ keys })
	}

	private async getUserAssignments(
		user: dto.UserDto,
		roleMapper?: RelationMap<number, RoleDto>,
		locationMapper?: RelationMap<number, LocationDto>,
	): Promise<dto.UserAssignmentDetailDto[]> {
		return record('UserService.getUserAssignments', async () => {
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

	async getList(): Promise<dto.UserDto[]> {
		return record('UserService.getList', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.USER_LIST,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getById(id: number): Promise<dto.UserDto | undefined> {
		return record('UserService.getById', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.USER_DETAIL(id),
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
			if (!user) throw new UserNotFoundError(id)
			const assignments = await this.getUserAssignments(user)

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
				key: IAM_CACHE_KEYS.USER_COUNT,
				factory: () => this.repo.count(),
			})
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	): Promise<void> {
		await record('UserService.seed', async () => {
			await this.repo.seed(data)
			await this.clearCache()
		})
	}

	async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
		return record('UserService.handleCreate', async () => {
			await UserValidator.checkCreateConflicts(data)

			const { assignments, password } = data
			const passwordHash = await Bun.password.hash(password)

			const insertedId = await this.repo.create({ ...data, passwordHash }, actorId)
			if (!insertedId) throw new UserCreateFailedError()

			if (assignments.length > 0) {
				// Delegate assignment writes to the owner service
				// await this.assignmentService.handleReplaceBulkByUserId(insertedId, assignments, actorId)
			}

			await this.clearCache()
			return { id: insertedId }
		})
	}

	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleUpdate', async () => {
			const existing = await this.getById(id)
			if (!existing) throw new UserNotFoundError(id)

			await UserValidator.checkUpdateConflicts(id, data)

			const { assignments, password } = data
			const passwordHash = password ? await Bun.password.hash(password) : undefined

			await this.repo.update({ ...data, passwordHash: passwordHash! }, actorId)

			if (assignments) {
				// Delegate assignment writes to the owner service
				// await this.assignmentService.handleReplaceBulkByUserId(id, assignments, actorId)
			}

			await this.clearCache(id)
			return { id }
		})
	}

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

	async handleChangePassword(
		id: number,
		data: dto.UserChangePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleChangePassword', async () => {
			const passwordHash = await this.repo.getPasswordHash(id)
			if (!passwordHash) throw new UserNotFoundError(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw new UserPasswordMismatchError()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			await this.repo.updatePassword(id, newPasswordHash, actorId)

			await this.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('UserService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw new UserNotFoundError(id)
			await this.clearCache(id)
			return { id: result }
		})
	}

	/* ========================================================================== */
	/*                            HANDLER OPERATIONS                             */
	/* ========================================================================== */

	async handleList(
		filter: dto.UserFilterDto,
	): Promise<core.WithPaginationResult<dto.UserDetailDto>> {
		return record('UserService.handleList', async () => {
			const p = await this.repo.getListPaginated(filter)

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
		const user = await this.getUserDetail(id)
		return resolveAudit(user)
	}
}

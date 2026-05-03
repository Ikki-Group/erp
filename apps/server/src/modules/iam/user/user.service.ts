import { record } from '@elysiajs/opentelemetry'
import { merge } from 'es-toolkit'

import * as core from '@/core/database'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { RelationMap } from '@/core/utils/relation-map'

import { usersTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'
import type { AuditResolved } from '@/lib/validation'

import type { LocationDto, LocationServiceModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import { UserErrors } from '../errors'
import type { RoleDto } from '../role/role.dto'
import type { RoleService } from '../role/role.service'
import * as dto from './user.dto'
import type { UserRepo } from './user.repo'

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

interface ServiceDeps {
	role: RoleService
	assignment: UserAssignmentService
	location: LocationServiceModule
}

export class UserService {
	private readonly cache: CacheService

	constructor(
		private readonly s: ServiceDeps,
		private readonly r: UserRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'iam.user', client: cacheClient })
	}

	/* --------------------------------- PRIVATE -------------------------------- */

	private async buildUserAssignments(
		user: dto.UserDto,
		roleMapper?: RelationMap<number, RoleDto>,
		locationMapper?: RelationMap<number, LocationDto>,
	): Promise<dto.UserAssignmentDetailDto[]> {
		const assignments: dto.UserAssignmentDetailDto[] = []
		const { id: userId, isRoot, defaultLocationId } = user

		if (isRoot) {
			const [superadmin, locations] = await Promise.all([
				this.s.role.getSuperadmin(),
				this.s.location.master.getList(),
			])
			const defaultAssignment = this.s.assignment.getDefaultAssignmentForSuperadmin()
			for (const location of locations) {
				assignments.push({ ...defaultAssignment, isDefault: false, role: superadmin, location })
			}
		} else {
			const [rawAssignments, roleMap, locationMap] = await Promise.all([
				this.s.assignment.findByUserId(userId),
				roleMapper ?? this.s.role.getRelationMap(),
				locationMapper ?? this.s.location.master.getRelationMap(),
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
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.UserDto[]> {
		return record('UserService.getList', async () => {
			return this.cache.getOrSet({
				key: 'list',
				factory: () => this.r.getList(),
			})
		})
	}

	async getById(id: number): Promise<dto.UserDto | undefined> {
		return record('UserService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.r.getById(id),
			})
		})
	}

	async getDetailById(id: number): Promise<dto.UserDetailDto> {
		return record('UserService.getDetailById', async () => {
			const user = await this.getById(id)
			if (!user) throw UserErrors.notFound(id)
			const assignments = await this.buildUserAssignments(user)
			return merge(user, { assignments })
		})
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(dto.UserDto & { passwordHash: string }) | null> {
		return this.r.getByIdentifier(identifier)
	}

	async count(): Promise<number> {
		return record('UserService.count', async () => {
			return this.cache.getOrSet({
				key: 'count',
				factory: () => this.r.count(),
			})
		})
	}

	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	): Promise<void> {
		await record('UserService.seed', async () => {
			await this.r.seed(data)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.UserFilterDto,
	): Promise<core.WithPaginationResult<dto.UserDetailDto>> {
		return record('UserService.handleList', async () => {
			const p = await this.r.getListPaginated(filter)

			const [roleMap, locationMap] = await Promise.all([
				this.s.role.getRelationMap(),
				this.s.location.master.getRelationMap(),
			])

			const data = await Promise.all(
				p.data.map(async (user) => {
					const assignments = await this.buildUserAssignments(user, roleMap, locationMap)
					return { ...user, assignments }
				}),
			)

			return { ...p, data }
		})
	}

	async handleDetail(id: number): Promise<dto.UserDetailDto & AuditResolved> {
		return record('UserService.handleDetail', async () => {
			const user = await this.getById(id)
			if (!user) throw UserErrors.notFound(id)
			const assignments = await this.buildUserAssignments(user)
			return resolveAudit({ ...user, assignments })
		})
	}

	async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
		return record('UserService.handleCreate', async () => {
			const { password, assignments, isRoot } = data
			const passwordHash = await Bun.password.hash(password)

			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
			})

			const insertedId = await this.r.create({ ...data, passwordHash }, actorId)
			if (!insertedId) throw UserErrors.createFailed()

			if (assignments && assignments.length > 0 && !isRoot) {
				await this.s.assignment.handleReplaceBulkByUserId(
					insertedId,
					assignments.map((a) => ({
						userId: insertedId,
						roleId: a.roleId,
						locationId: a.locationId,
					})),
					actorId,
				)
			}

			await this.cache.deleteMany({ keys: ['list', 'count'] })

			return { id: insertedId }
		})
	}

	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleUpdate', async () => {
			const { assignments, password, isRoot } = data

			const existing = await this.getById(id)
			if (!existing) throw UserErrors.notFound(id)

			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
				existing,
			})

			const passwordHash = password ? await Bun.password.hash(password) : undefined
			await this.r.update({ ...data, id, ...(passwordHash ? { passwordHash } : {}) }, actorId)

			if (assignments && assignments.length >= 0 && !isRoot) {
				await this.s.assignment.handleReplaceBulkByUserId(
					id,
					assignments.map((a) => ({ userId: id, roleId: a.roleId, locationId: a.locationId })),
					actorId,
				)
			}

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}

	async handleChangePassword(
		id: number,
		data: dto.UserChangePasswordDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleChangePassword', async () => {
			const passwordHash = await this.r.getPasswordHash(id)
			if (!passwordHash) throw UserErrors.notFound(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw UserErrors.passwordMismatch()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			await this.r.updatePassword(id, newPasswordHash, actorId)

			await this.cache.deleteMany({ keys: [`byId:${id}`] })

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
			await this.r.updatePassword(id, passwordHash, actorId)

			await this.cache.deleteMany({ keys: [`byId:${id}`] })

			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('UserService.handleRemove', async () => {
			const result = await this.r.remove(id)
			if (!result) throw UserErrors.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id: result }
		})
	}
}

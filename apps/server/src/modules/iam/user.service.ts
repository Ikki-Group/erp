import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { RelationMap } from '@/shared/utils'

import { usersTable } from '@/db/schema'

import { checkConflict, type ConflictField } from '@/infra/database'
import { InternalServerError, NotFoundError, BadRequestError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import type { LocationServiceModule } from '@/modules/location'

import type { UserAssignmentService } from './assignment.service'
import type { RoleService } from './role.service'
import { UserRepo } from './user.repo'
import type {
	UserSchema,
	UserFilterSchema,
	UserCreateSchema,
	UserUpdateSchema,
	UserChangePasswordSchema,
	UserAdminUpdatePasswordSchema,
} from './user.schema'

const userConflictFields: ConflictField<{ email: string; username: string }>[] = [
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

const err = {
	notFound: (id: number) =>
		new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('User creation failed', { code: 'USER_CREATE_FAILED' }),
	passwordMismatch: () =>
		new BadRequestError('Old password does not match', { code: 'USER_PASSWORD_MISMATCH' }),
}

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
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.user')
	}

	/* --------------------------------- PUBLIC -------------------------------- */

	async getListPaginated(filter: UserFilterSchema): Promise<WithPaginationResult<UserSchema>> {
		return record('UserService.getListPaginated', async () => this.r.getListPaginated(filter))
	}

	async getListAll(): Promise<UserSchema[]> {
		return record('UserService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.r.getList(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, UserSchema>> {
		return record('UserService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async seed(
		data: (UserCreateSchema & { passwordHash: string; createdBy: ActorId; isRoot?: boolean })[],
	): Promise<void> {
		return record('UserService.seed', async () => {
			for (const d of data) {
				const existing = await this.getByIdentifier(d.email)
				if (existing) continue

				await this.create(d, d.createdBy)
			}
		})
	}

	async getById(id: number): Promise<UserSchema | undefined> {
		return record('UserService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.r.getById(id),
			}),
		)
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(UserSchema & { passwordHash: string }) | null> {
		return this.r.getByIdentifier(identifier)
	}

	async create(
		data: UserCreateSchema & { passwordHash: string },
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.create', async () => {
			const { assignments, isRoot } = data

			await checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
			})

			const result = await this.r.create(data, actorId)
			if (!result) throw err.createFailed()

			if (assignments && assignments.length > 0 && !isRoot) {
				await this.s.assignment.handleReplaceBulkByUserId(
					result.id,
					assignments.map((a) => ({
						userId: result.id,
						roleId: a.roleId,
						locationId: a.locationId,
					})),
					actorId,
				)
			}

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])

			return result
		})
	}

	async update(
		id: number,
		data: UserUpdateSchema & { passwordHash?: string },
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.update', async () => {
			const { assignments, isRoot } = data

			const existing = await this.r.getById(id)
			if (!existing) throw err.notFound(id)

			console.debug({ existing })

			await checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
				existing,
			})

			const result = await this.r.update(id, data, actorId)
			if (!result) throw err.notFound(id)

			if (assignments && assignments.length >= 0 && !isRoot) {
				await this.s.assignment.handleReplaceBulkByUserId(
					id,
					assignments.map((a) => ({ userId: id, roleId: a.roleId, locationId: a.locationId })),
					actorId,
				)
			}

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleCreate(data: UserCreateSchema, actorId: ActorId): Promise<EntityRef> {
		return record('UserService.handleCreate', async () => {
			const { password } = data
			const passwordHash = await Bun.password.hash(password)

			return this.create({ ...data, passwordHash }, actorId)
		})
	}

	async handleUpdate(data: UserUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		return record('UserService.handleUpdate', async () => {
			const { password, id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const passwordHash = password ? await Bun.password.hash(password) : undefined
			const result = await this.update(
				id,
				{ ...data, ...(passwordHash ? { passwordHash } : {}) },
				actorId,
			)
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('UserService.handleRemove', async () => {
			const result = await this.r.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	async handleChangePassword(
		id: number,
		data: UserChangePasswordSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.handleChangePassword', async () => {
			const passwordHash = await this.r.getPasswordHash(id)
			if (!passwordHash) throw err.notFound(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw err.passwordMismatch()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			const result = await this.r.updatePassword(id, newPasswordHash, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.byId(id)])

			return result
		})
	}

	async handleAdminUpdatePassword(
		data: UserAdminUpdatePasswordSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.handleAdminUpdatePassword', async () => {
			const { id, password } = data
			const passwordHash = await Bun.password.hash(password)
			const result = await this.r.updatePassword(id, passwordHash, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.byId(id)])

			return result
		})
	}
}

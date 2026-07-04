import { record } from '@elysiajs/opentelemetry'

import { usersTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import {
	checkConflict,
	withTransaction,
	type ConflictField,
	type DbContext,
} from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'
import { hashPassword, verifyPassword } from '@/shared/utils/password'

import type { LocationModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import type {
	UserDto,
	UserCreateDto,
	UserUpdateDto,
	UserChangePasswordDto,
	UserAdminUpdatePasswordDto,
	UserWithPasswordDto,
} from './user.contract'
import { UserError } from './user.internal'
import type { IUserRepo } from './user.repo'

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

interface ServiceDeps {
	assignment: UserAssignmentService
	location: LocationModule
}

/** Strip the password hash before a user record leaves the service boundary. */
function toUserDto(user: UserWithPasswordDto): UserDto {
	const { passwordHash: _passwordHash, ...rest } = user
	return rest
}

export class UserService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: ServiceDeps,
		private readonly repo: IUserRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.user')
	}

	/** Invalidate list/count caches, plus the byId cache when an id is given. */
	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	/* --------------------------------- PUBLIC -------------------------------- */

	async getListAll(): Promise<UserDto[]> {
		return record('UserService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			}),
		)
	}

	async count(): Promise<number> {
		return record('UserService.count', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.repo.count(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, UserDto>> {
		return record('UserService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async seed(
		items: (Pick<UserDto, 'id' | 'email' | 'username' | 'fullname' | 'isRoot' | 'createdBy'> & {
			password: string
		})[],
		db: DbContext,
	): Promise<void> {
		return record('UserService.seed', async () => {
			const parsed: (typeof usersTable.$inferInsert)[] = []

			for (const item of items) {
				parsed.push({
					...item,
					passwordHash: await hashPassword(item.password),
					...stampCreate(item.createdBy),
				})
			}

			await this.repo.insertMany(parsed, db)
		})
	}

	async getById(id: number): Promise<UserDto | undefined> {
		return record('UserService.getById', async () => {
			const user = await this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id).then((u) => (u ? toUserDto(u) : undefined)),
			})
			return user
		})
	}

	async getByIdentifier(identifier: string): Promise<UserWithPasswordDto | undefined> {
		return record('UserService.getByIdentifier', () => this.repo.getByIdentifier(identifier))
	}

	async create(
		data: UserCreateDto & { passwordHash: string },
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.create', async () => {
			const { assignments, isRoot } = data

			await checkConflict({
				db: this.repo.db,
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
			})

			// User row + assignments must commit together.
			const result = await withTransaction(this.repo.db, async (tx) => {
				const created = await this.repo.insert({ ...data, ...stampCreate(actorId) }, tx)
				if (!created) throw UserError.createFailed()

				if (!isRoot && assignments.length > 0) {
					await this.deps.assignment.replaceByUserId(
						created.id,
						assignments.map((a) => ({ roleId: a.roleId, locationId: a.locationId })),
						actorId,
						tx,
					)
				}

				return created
			})

			await this.invalidate()
			return result
		})
	}

	async update(
		id: number,
		data: UserUpdateDto & { passwordHash?: string },
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.update', async () => {
			const { assignments, isRoot } = data

			const existing = await this.repo.getById(id)
			if (!existing) throw UserError.notFound(id)

			await checkConflict({
				db: this.repo.db,
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: { email: data.email, username: data.username },
				existing,
			})

			const result = await withTransaction(this.repo.db, async (tx) => {
				const updated = await this.repo.update(id, { ...data, ...stampUpdate(actorId) }, tx)
				if (!updated) throw UserError.notFound(id)

				if (!isRoot) {
					await this.deps.assignment.replaceByUserId(
						id,
						assignments.map((a) => ({ roleId: a.roleId, locationId: a.locationId })),
						actorId,
						tx,
					)
				}

				return updated
			})

			await this.invalidate(id)
			return result
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleCreate(data: UserCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UserService.handleCreate', async () => {
			const passwordHash = await hashPassword(data.password)
			return this.create({ ...data, passwordHash }, actorId)
		})
	}

	async handleUpdate(data: UserUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UserService.handleUpdate', async () => {
			const { password, id } = data

			const existing = await this.getById(id)
			if (!existing) throw UserError.notFound(id)

			const passwordHash = password ? await hashPassword(password) : undefined
			return this.update(id, { ...data, ...(passwordHash ? { passwordHash } : {}) }, actorId)
		})
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('UserService.handleDelete', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw UserError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleChangePassword(
		id: number,
		data: UserChangePasswordDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.handleChangePassword', async () => {
			const passwordHash = await this.repo.getById(id).then((u) => u?.passwordHash)
			if (!passwordHash) throw UserError.notFound(id)

			const isMatch = await verifyPassword(data.oldPassword, passwordHash)
			if (!isMatch) throw UserError.passwordMismatch()

			const newPasswordHash = await hashPassword(data.newPassword)
			const result = await this.repo.update(id, {
				passwordHash: newPasswordHash,
				...stampUpdate(actorId),
			})
			if (!result) throw UserError.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.byId(id)])

			return result
		})
	}

	async handleAdminUpdatePassword(
		data: UserAdminUpdatePasswordDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('UserService.handleAdminUpdatePassword', async () => {
			const { id, password } = data
			const passwordHash = await hashPassword(password)
			const result = await this.repo.update(id, {
				passwordHash,
				...stampUpdate(actorId),
			})
			if (!result) throw UserError.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.byId(id)])

			return result
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import * as core from '@/core/database'

import { usersTable } from '@/db/schema'

import { IAM_CACHE_KEYS } from '../constants'
import * as dto from '../dto/user.dto'
import { UserErrors } from '../errors'
import { UserRepo } from '../repo/user.repo'

const cache = bento.namespace('user')

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

// User Service
// Handles identity, profile, and single-entity user operations
// Cross-module orchestration (assignments enrichment) lives in UserUsecases
export class UserService {
	constructor(private repo = new UserRepo()) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	private async clearCache(id?: number) {
		const keys = [IAM_CACHE_KEYS.USER_LIST, IAM_CACHE_KEYS.USER_COUNT]
		if (id) keys.push(IAM_CACHE_KEYS.USER_DETAIL(id))
		await cache.deleteMany({ keys })
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

	async getListPaginated(filter: dto.UserFilterDto): Promise<core.WithPaginationResult<dto.UserDto>> {
		return record('UserService.getListPaginated', async () => {
			return this.repo.getListPaginated(filter)
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

	/**
	 * Creates a user record (without assignments — that's handled by UserUsecases).
	 * Returns the inserted ID.
	 */
	async handleCreate(
		data: dto.UserCreateDto & { passwordHash: string },
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleCreate', async () => {
			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
			})

			const insertedId = await this.repo.create(data, actorId)
			if (!insertedId) throw UserErrors.createFailed()

			await this.clearCache()
			return { id: insertedId }
		})
	}

	/**
	 * Updates a user record (without assignments — that's handled by UserUsecases).
	 */
	async handleUpdate(
		id: number,
		data: dto.UserUpdateDto & { passwordHash?: string },
		actorId: number,
	): Promise<{ id: number }> {
		return record('UserService.handleUpdate', async () => {
			const existing = await this.getById(id)
			if (!existing) throw UserErrors.notFound(id)

			await core.checkConflict({
				table: usersTable,
				pkColumn: usersTable.id,
				fields: userConflictFields,
				input: data,
				existing,
			})

			await this.repo.update({ ...data, id, passwordHash: data.passwordHash! }, actorId)

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
			if (!passwordHash) throw UserErrors.notFound(id)

			const isMatch = await Bun.password.verify(data.oldPassword, passwordHash)
			if (!isMatch) throw UserErrors.passwordMismatch()

			const newPasswordHash = await Bun.password.hash(data.newPassword)
			await this.repo.updatePassword(id, newPasswordHash, actorId)

			await this.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('UserService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw UserErrors.notFound(id)
			await this.clearCache(id)
			return { id: result }
		})
	}
}

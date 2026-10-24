import { users } from '@/db/schema/iam.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { SessionStore } from '@/shared/auth/session.port.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound, hashPassword, verifyPassword } from '@/shared/utils/index.ts'

import type {
	UserChangePasswordDto,
	UserCreateDto,
	UserDto,
	UserFilterDto,
	UserProfileUpdateDto,
	UserResetPasswordDto,
	UserUpdateDto,
} from './user.contract.ts'
import { UserError, uniqueFields } from './user.internal.ts'
import type { IUserRepo } from './user.repo.ts'

// ─── Dependencies ───

export interface UserServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
	sessionStore: SessionStore
}

// ─── Service ───

export class UserService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IUserRepo,
		cacheClient: CacheClient,
		private readonly deps: UserServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'user')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<UserDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<UserDto> {
		return assertFound(await this.getById(id), () => UserError.notFound(id))
	}

	async handleList(filter: UserFilterDto): Promise<WithPaginationResult<UserDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: UserCreateDto, actor: Actor): Promise<EntityRef> {
		actor.assertCan(null)
		const passwordHash = await hashPassword(data.password)
		const result = await this.deps.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: users,
				pkColumn: users.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert(
				{
					username: data.username,
					email: data.email,
					name: data.name,
					passwordHash,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw UserError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: written.id,
					action: 'create',
					summary: `Created user "${data.username}" (${data.email})`,
					newValues: { username: data.username, email: data.email, name: data.name },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: UserUpdateDto, actor: Actor): Promise<EntityRef> {
		actor.assertCan(null)
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw UserError.notFound(id)

			await checkConflict({
				db: tx,
				table: users,
				pkColumn: users.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const payload = {
				username: updateData.username,
				email: updateData.email,
				name: updateData.name,
				isActive: updateData.isActive,
				...stampUpdate(actor.id),
			}

			const written = await this.repo.update(id, payload, tx)
			if (!written) throw UserError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: id,
					action: 'update',
					summary: `Updated user "${data.username}" (${data.email})`,
					newValues: { username: data.username, email: data.email, name: data.name },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		await invalidateAuthCache(id)
		return result
	}

	/** Self-service: the caller edits their own name/email; username, status and assignments stay. */
	async handleUpdateProfile(data: UserProfileUpdateDto, actor: Actor): Promise<EntityRef> {
		const id = actor.id
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw UserError.notFound(id)

			await checkConflict<UserCreateDto>({
				db: tx,
				table: users,
				pkColumn: users.id,
				fields: uniqueFields,
				input: { email: data.email },
				excludeId: id,
			})

			const written = await this.repo.update(
				id,
				{ email: data.email, name: data.name, ...stampUpdate(actor.id) },
				tx,
			)
			if (!written) throw UserError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: id,
					action: 'update-profile',
					summary: `Updated own profile "${existing.username}" (${data.email})`,
					newValues: { email: data.email, name: data.name },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		await invalidateAuthCache(id)
		return result
	}

	/** Self-service: verifies the caller's current password, then stores the new one. Sessions are the caller's to revoke. */
	async handleChangePassword(data: UserChangePasswordDto, actor: Actor): Promise<EntityRef> {
		const id = actor.id
		const existing = assertFound(await this.repo.findByIdRaw(id), () => UserError.notFound(id))
		if (!(await verifyPassword(data.currentPassword, existing.passwordHash))) {
			throw UserError.invalidCurrentPassword()
		}
		if (data.newPassword === data.currentPassword) throw UserError.passwordUnchanged()

		const passwordHash = await hashPassword(data.newPassword)
		const result = await this.deps.uow.run(async (tx) => {
			const written = await this.repo.update(id, { passwordHash, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UserError.resetPasswordFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: id,
					action: 'change-password',
					summary: `Changed own password for user "${existing.username}"`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		return result
	}

	async handleResetPassword(data: UserResetPasswordDto, actor: Actor): Promise<EntityRef> {
		actor.assertCan(null)
		const passwordHash = await hashPassword(data.password)
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(data.id, tx)
			if (!existing) throw UserError.notFound(data.id)

			const written = await this.repo.update(
				data.id,
				{ passwordHash, ...stampUpdate(actor.id) },
				tx,
			)
			if (!written) throw UserError.resetPasswordFailed(data.id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: data.id,
					action: 'reset-password',
					summary: `Reset password for user "${existing.username}" (${existing.email})`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(data.id)
		await invalidateAuthCache(data.id)
		// Force sign-out everywhere — a password reset should invalidate every
		// existing session, not just future auth checks.
		await this.deps.sessionStore.deleteAllForUser(data.id)
		return result
	}

	async handleDeactivate(id: number, actor: Actor): Promise<EntityRef> {
		actor.assertCan(null)
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw UserError.notFound(id)

			const written = await this.repo.update(id, { isActive: false, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UserError.deactivateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user',
					entityId: id,
					action: 'update',
					summary: `Deactivated user "${existing.username}" (${existing.email})`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		await invalidateAuthCache(id)
		return result
	}
}

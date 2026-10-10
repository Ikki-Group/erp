import { users } from '@/db/schema/iam.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import { invalidateUserAccess } from '@/server/auth/access.ts'
import { forgetSessions } from '@/server/auth/session.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { hashPassword } from '@/shared/utils/index.ts'

import type { UserCreateDto, UserResetPasswordDto, UserUpdateDto } from '@ikki/contract/iam/user'
import { UserError, uniqueFields } from './user.internal.ts'
import type { UserRepo } from './user.repo.ts'

interface Deps extends Infra {
	repo: UserRepo
}

export interface UserCredentials {
	id: number
	username: string
	name: string
	email: string
	passwordHash: string
	isActive: boolean
}

const AUDIT = { module: 'iam', entity: 'user' } as const

export class UserService {
	constructor(private readonly deps: Deps) {}

	findCredentials(username: string): Promise<UserCredentials | undefined> {
		return this.deps.repo.findCredentials(username)
	}

	async handleCreate(data: UserCreateDto, actor: Actor): Promise<EntityRef> {
		const passwordHash = await hashPassword(data.password)
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: users,
				pkColumn: users.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert(
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
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created user "${data.username}" (${data.email})`,
				newValues: { username: data.username, email: data.email, name: data.name },
			})
			return written
		})
	}

	/** Setting `isActive: false` here is a deactivation and revokes sessions too. */
	async handleUpdate(data: UserUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		const { written, revoked } = await uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw UserError.notFound(id)
			await checkConflict({
				db: tx,
				table: users,
				pkColumn: users.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(
				id,
				{
					username: changes.username,
					email: changes.email,
					name: changes.name,
					isActive: changes.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw UserError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated user "${data.username}" (${data.email})`,
				oldValues: { username: existing.username, email: existing.email, name: existing.name },
				newValues: { username: data.username, email: data.email, name: data.name },
			})
			const revoked = changes.isActive ? [] : await repo.revokeSessions(id, tx)
			return { written, revoked }
		})
		await this.#afterAccessChange(id, revoked)
		return written
	}

	/** A password reset signs the user out everywhere. */
	async handleResetPassword(data: UserResetPasswordDto, actor: Actor): Promise<EntityRef> {
		const passwordHash = await hashPassword(data.password)
		const { repo, uow, audit } = this.deps
		const { written, revoked } = await uow.run(async (tx) => {
			const existing = await repo.findById(data.id, tx)
			if (!existing) throw UserError.notFound(data.id)
			const written = await repo.update(data.id, { passwordHash, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UserError.resetPasswordFailed(data.id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: data.id,
				action: 'reset-password',
				summary: `Reset password for user "${existing.username}" (${existing.email})`,
			})
			return { written, revoked: await repo.revokeSessions(data.id, tx) }
		})
		await this.#afterAccessChange(data.id, revoked)
		return written
	}

	async handleDeactivate(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		const { written, revoked } = await uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw UserError.notFound(id)
			const written = await repo.update(id, { isActive: false, ...stampUpdate(actor.id) }, tx)
			if (!written) throw UserError.deactivateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Deactivated user "${existing.username}" (${existing.email})`,
			})
			return { written, revoked: await repo.revokeSessions(id, tx) }
		})
		await this.#afterAccessChange(id, revoked)
		return written
	}

	/** Runs after commit: drop cached sessions and the cached access map. */
	async #afterAccessChange(userId: number, revokedSessionIds: string[]): Promise<void> {
		await forgetSessions(revokedSessionIds)
		await invalidateUserAccess(userId)
	}
}

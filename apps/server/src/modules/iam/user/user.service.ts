import { users } from '@/db/schema/iam.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound, hashPassword } from '@/shared/utils/index.ts'

import type { UserCreateDto, UserDto, UserFilterDto, UserUpdateDto } from './user.contract.ts'
import { UserError, uniqueFields } from './user.internal.ts'
import type { IUserRepo } from './user.repo.ts'

// ─── Dependencies ───

export interface UserServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
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
		const { id, password, ...updateData } = data
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

			const payload: Record<string, unknown> = {
				username: updateData.username,
				email: updateData.email,
				name: updateData.name,
				isActive: updateData.isActive,
				...stampUpdate(actor.id),
			}
			if (password) payload['passwordHash'] = await hashPassword(password)

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

	async handleDeactivate(id: number, actor: Actor): Promise<EntityRef> {
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

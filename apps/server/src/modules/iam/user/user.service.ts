import { users } from '@/db/schema/iam.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound, hashPassword } from '@/shared/utils/index.ts'

import type { UserCreateDto, UserDto, UserFilterDto, UserUpdateDto } from './user.contract.ts'
import { UserError, uniqueFields } from './user.internal.ts'
import type { IUserRepo } from './user.repo.ts'

// ─── Service ───

export class UserService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IUserRepo,
		cacheClient: CacheClient,
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

	async handleCreate(data: UserCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: users,
			pkColumn: users.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Hash password
		const passwordHash = await hashPassword(data.password)

		// 3. Insert
		const result = await this.repo.insert({
			username: data.username,
			email: data.email,
			name: data.name,
			passwordHash,
			isActive: data.isActive ? 1 : 0,
			...stampCreate(actorId),
		})
		if (!result) throw UserError.createFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'user',
			entityId: result.id,
			action: 'create',
			summary: `Created user "${data.username}" (${data.email})`,
			newValues: { username: data.username, email: data.email, name: data.name },
		})

		return result
	}

	async handleUpdate(data: UserUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, password, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: users,
			pkColumn: users.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Build update payload
		const payload: Record<string, unknown> = {
			username: updateData.username,
			email: updateData.email,
			name: updateData.name,
			isActive: updateData.isActive ? 1 : 0,
			...stampUpdate(actorId),
		}

		// 4. Hash password if provided
		if (password) {
			payload['passwordHash'] = await hashPassword(password)
		}

		// 5. Update
		const result = await this.repo.update(id, payload)
		if (!result) throw UserError.updateFailed(id)

		// 6. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 7. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'user',
			entityId: id,
			action: 'update',
			summary: `Updated user "${data.username}" (${data.email})`,
			newValues: { username: data.username, email: data.email, name: data.name },
		})

		return result
	}

	async handleDeactivate(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Deactivate
		const result = await this.repo.update(id, {
			isActive: 0,
			...stampUpdate(actorId),
		})
		if (!result) throw UserError.deactivateFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'user',
			entityId: id,
			action: 'update',
			summary: `Deactivated user "${existing.username}" (${existing.email})`,
		})

		return result
	}
}

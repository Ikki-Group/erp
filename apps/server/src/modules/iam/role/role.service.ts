import { roles } from '@/db/schema/iam.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role.contract.ts'
import { RoleError, uniqueFields } from './role.internal.ts'
import type { IRoleRepo } from './role.repo.ts'

// ─── Service ───

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IRoleRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'role')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<RoleDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getAll(): Promise<RoleDto[]> {
		return this.cache.getOrSet({
			key: this.cache.keys.list,
			factory: () => this.repo.findMany(),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<RoleDto> {
		return assertFound(await this.getById(id), () => RoleError.notFound(id))
	}

	async handleList(filter: RoleFilterDto): Promise<WithPaginationResult<RoleDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: RoleCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: roles,
			pkColumn: roles.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({
			...data,
			isSystem: 0,
			...stampCreate(actorId),
		})
		if (!result) throw RoleError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'role',
			entityId: result.id,
			action: 'create',
			summary: `Created role "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, permissions: data.permissions },
		})

		return result
	}

	async handleUpdate(data: RoleUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists + check system role
		const existing = await this.handleGetById(id)
		if (existing.isSystem) throw RoleError.systemRoleImmutable()

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: roles,
			pkColumn: roles.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, {
			...updateData,
			...stampUpdate(actorId),
		})
		if (!result) throw RoleError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'role',
			entityId: id,
			action: 'update',
			summary: `Updated role "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, permissions: data.permissions },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists + check system role
		const existing = await this.handleGetById(id)
		if (existing.isSystem) throw RoleError.systemRoleImmutable()

		// 2. Soft-delete via update (set permissions empty, rename code)
		const result = await this.repo.update(id, {
			...stampUpdate(actorId),
		})
		if (!result) throw RoleError.updateFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'role',
			entityId: id,
			action: 'delete',
			summary: `Deleted role "${existing.name}" (${existing.code})`,
		})

		return result
	}
}

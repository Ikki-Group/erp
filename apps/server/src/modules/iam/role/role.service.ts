import { roles } from '@/db/schema/iam.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { invalidateAuthCacheForRole } from '@/shared/auth/access-cache.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role.contract.ts'
import { RoleError, uniqueFields } from './role.internal.ts'
import type { IRoleRepo } from './role.repo.ts'

// ─── Dependencies ───

export interface RoleServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

// ─── Service ───

export class RoleService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IRoleRepo,
		cacheClient: CacheClient,
		private readonly deps: RoleServiceDeps,
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

	async handleCreate(data: RoleCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: roles,
				pkColumn: roles.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert(
				{
					...data,
					isSystem: false,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw RoleError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'role',
					entityId: written.id,
					action: 'create',
					summary: `Created role "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, permissions: data.permissions },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: RoleUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw RoleError.notFound(id)
			if (existing.isSystem) throw RoleError.systemRoleImmutable()

			await checkConflict({
				db: tx,
				table: roles,
				pkColumn: roles.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw RoleError.updateFailed(id)
			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'role',
					entityId: id,
					action: 'update',
					summary: `Updated role "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, permissions: data.permissions },
				}),
				tx,
			)
			return written
		})

		await invalidateAuthCacheForRole(id)
		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw RoleError.notFound(id)
			if (existing.isSystem) throw RoleError.systemRoleImmutable()

			const written = await this.repo.update(id, stampUpdate(actor.id), tx)
			if (!written) throw RoleError.updateFailed(id)
			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'role',
					entityId: id,
					action: 'delete',
					summary: `Deleted role "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		await invalidateAuthCacheForRole(id)
		await this.cache.invalidateStandard(id)
		return result
	}
}

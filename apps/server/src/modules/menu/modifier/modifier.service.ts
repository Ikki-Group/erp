import { modifierGroups } from '@/db/schema/menu.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	ModifierGroupCreateDto,
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
} from './modifier.contract.ts'
import type { IModifierRepo } from './modifier.repo.ts'

// ─── Error Factories ───

const ModifierError = {
	notFound: (id: number) =>
		new NotFoundError('Modifier group not found', {
			code: 'MODIFIER_GROUP_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Modifier group creation failed', {
			code: 'MODIFIER_GROUP_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Modifier group update failed', {
			code: 'MODIFIER_GROUP_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Modifier group deletion failed', {
			code: 'MODIFIER_GROUP_DELETE_FAILED',
			context: { id },
		}),
}

// ─── Unique Constraint Fields ───

const uniqueFields = defineConflictFields<ModifierGroupCreateDto>()([
	{
		field: 'name',
		column: modifierGroups.name,
		message: 'Modifier group name already exists at this location',
		code: 'MODIFIER_GROUP_NAME_EXISTS',
	},
])

// ─── Service ───

export class ModifierService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IModifierRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'modifier-group')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<ModifierGroupDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByIdWithOptions(id: number): Promise<ModifierGroupWithOptionsDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `${this.cache.namespace}:detail:${id}`,
			factory: () => this.repo.findByIdWithOptions(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<ModifierGroupDto> {
		return assertFound(await this.getById(id), () => ModifierError.notFound(id))
	}

	async handleDetail(id: number): Promise<ModifierGroupWithOptionsDto> {
		return assertFound(await this.getByIdWithOptions(id), () => ModifierError.notFound(id))
	}

	async handleList(
		filter: ModifierGroupFilterDto,
	): Promise<WithPaginationResult<ModifierGroupDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: ModifierGroupCreateDto, actorId: ActorId): Promise<EntityRef> {
		const { options, ...groupData } = data

		// 1. Check conflicts (name unique within location)
		await checkConflict({
			db: this.repo.db,
			table: modifierGroups,
			pkColumn: modifierGroups.id,
			fields: uniqueFields,
			input: groupData,
		})

		// 2. Create group + options in transaction
		const result = await this.repo.db.transaction(async (tx) => {
			const created = await this.repo.insert({ ...groupData, ...stampCreate(actorId) }, tx)
			if (!created) throw ModifierError.createFailed()

			await this.repo.replaceOptions(created.id, options, tx)
			return created
		})

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'modifier_group',
			entityId: result.id,
			action: 'create',
			summary: `Created modifier group "${groupData.name}" with ${options.length} options`,
			newValues: {
				name: groupData.name,
				locationId: groupData.locationId,
				optionCount: options.length,
			},
		})

		return result
	}

	async handleUpdate(data: ModifierGroupUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, options, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: modifierGroups,
			pkColumn: modifierGroups.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update group + replace options in transaction
		const result = await this.repo.db.transaction(async (tx) => {
			const updated = await this.repo.update(id, { ...updateData, ...stampUpdate(actorId) }, tx)
			if (!updated) throw ModifierError.updateFailed(id)

			await this.repo.replaceOptions(id, options, tx)
			return updated
		})

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'modifier_group',
			entityId: id,
			action: 'update',
			summary: `Updated modifier group "${updateData.name ?? existing.name}"`,
			newValues: { ...updateData, optionCount: options.length },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete (options cascade)
		const result = await this.repo.remove(id)
		if (!result) throw ModifierError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'modifier_group',
			entityId: id,
			action: 'delete',
			summary: `Deleted modifier group "${existing.name}"`,
		})

		return result
	}
}

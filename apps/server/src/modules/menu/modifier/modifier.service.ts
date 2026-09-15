import { modifierGroups } from '@/db/schema/menu.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
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
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
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

	async handleCreate(data: ModifierGroupCreateDto, actor: Actor): Promise<EntityRef> {
		const { options, ...groupData } = data

		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: modifierGroups,
				pkColumn: modifierGroups.id,
				fields: uniqueFields,
				input: groupData,
			})

			const created = await this.repo.insert({ ...groupData, ...stampCreate(actor.id) }, tx)
			if (!created) throw ModifierError.createFailed()

			await this.repo.replaceOptions(created.id, options, tx)
			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'modifier_group',
					entityId: created.id,
					action: 'create',
					summary: `Created modifier group "${groupData.name}" with ${options.length} options`,
					newValues: {
						name: groupData.name,
						locationId: groupData.locationId,
						optionCount: options.length,
					},
				}),
				tx,
			)
			return created
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: ModifierGroupUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, options, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Update group, options, and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: modifierGroups,
				pkColumn: modifierGroups.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const updated = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!updated) throw ModifierError.updateFailed(id)

			await this.repo.replaceOptions(id, options, tx)
			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'modifier_group',
					entityId: id,
					action: 'update',
					summary: `Updated modifier group "${updateData.name ?? existing.name}"`,
					newValues: { ...updateData, optionCount: options.length },
				}),
				tx,
			)
			return updated
		})

		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw ModifierError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'modifier_group',
					entityId: id,
					action: 'delete',
					summary: `Deleted modifier group "${existing.name}"`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		return result
	}
}

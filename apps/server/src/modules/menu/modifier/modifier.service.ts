import { modifierGroups } from '@/db/schema/menu.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
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
import { ModifierError, uniqueFields } from './modifier.internal.ts'
import type { IModifierRepo } from './modifier.repo.ts'

// ─── Service ───

export class ModifierService {
	private readonly cache: CacheService
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: IModifierRepo,
		cacheClient: CacheClient,
		uow: UnitOfWork,
		audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'modifier-group')
		this.mutation = { uow, audit, module: 'menu', entity: 'modifier_group', invalidate: this.cache }
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

		return mutate(this.mutation, actor, async (tx) => {
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
			return {
				result: created,
				audit: {
					action: 'create',
					summary: `Created modifier group "${groupData.name}" with ${options.length} options`,
					newValues: {
						name: groupData.name,
						locationId: groupData.locationId,
						optionCount: options.length,
					},
				},
			}
		})
	}

	async handleUpdate(data: ModifierGroupUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, options, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Update group, options, and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
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
			return {
				result: updated,
				audit: {
					action: 'update',
					summary: `Updated modifier group "${updateData.name ?? existing.name}"`,
					newValues: { ...updateData, optionCount: options.length },
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw ModifierError.deleteFailed(id)

			return {
				result: written,
				audit: { action: 'delete', summary: `Deleted modifier group "${existing.name}"` },
			}
		})
	}
}

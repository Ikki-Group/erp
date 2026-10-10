import { modifierGroups } from '@/db/schema/menu.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	ModifierGroupCreateDto,
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
} from './modifier.contract.ts'
import { ModifierError, modifierUniqueFields } from './modifier.internal.ts'
import type { ModifierRepo } from './modifier.repo.ts'

interface Deps extends Infra {
	repo: ModifierRepo
}

const AUDIT = { module: 'menu', entity: 'modifier_group' } as const

export class ModifierService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number, db?: Db): Promise<ModifierGroupDto> {
		const group = await this.deps.repo.findById(id, db)
		if (!group) throw ModifierError.notFound(id)
		return group
	}

	async handleDetail(id: number): Promise<ModifierGroupWithOptionsDto> {
		const group = await this.deps.repo.findByIdWithOptions(id)
		if (!group) throw ModifierError.notFound(id)
		return group
	}

	handleList(filter: ModifierGroupFilterDto): Promise<WithPaginationResult<ModifierGroupDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: ModifierGroupCreateDto, actor: Actor): Promise<EntityRef> {
		const { options, ...group } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: modifierGroups,
				pkColumn: modifierGroups.id,
				fields: modifierUniqueFields,
				input: group,
			})
			const created = await repo.insert({ ...group, ...stampCreate(actor.id) }, tx)
			if (!created) throw ModifierError.createFailed()
			await repo.replaceOptions(created.id, options, tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: created.id,
				action: 'create',
				summary: `Created modifier group "${group.name}" with ${options.length} options`,
				newValues: { name: group.name, locationId: group.locationId, optionCount: options.length },
				locationId: group.locationId,
			})
			return created
		})
	}

	handleUpdate(data: ModifierGroupUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, options, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			await checkConflict({
				db: tx,
				table: modifierGroups,
				pkColumn: modifierGroups.id,
				fields: modifierUniqueFields,
				input: changes,
				excludeId: id,
			})
			const updated = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!updated) throw ModifierError.updateFailed(id)
			await repo.replaceOptions(id, options, tx)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated modifier group "${changes.name}"`,
				newValues: { ...changes, optionCount: options.length },
				locationId: existing.locationId,
			})
			return updated
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			const written = await repo.remove(id, tx)
			if (!written) throw ModifierError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted modifier group "${existing.name}"`,
				locationId: existing.locationId,
			})
			return written
		})
	}
}

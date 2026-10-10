import { menuCategories } from '@/db/schema/menu.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import { CategoryError, categoryUniqueFields } from './category.internal.ts'
import type { CategoryRepo } from './category.repo.ts'
import type {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from '@ikki/contract/menu/category'

interface Deps extends Infra {
	repo: CategoryRepo
}

const AUDIT = { module: 'menu', entity: 'menu_category' } as const

export class CategoryService {
	constructor(private readonly deps: Deps) {}

	getById(id: number, db?: Db): Promise<MenuCategoryDto | undefined> {
		return this.deps.repo.findById(id, db)
	}

	handleList(filter: MenuCategoryFilterDto): Promise<WithPaginationResult<MenuCategoryDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: MenuCategoryCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			if (data.parentId) await this.#assertParentLocation(data.parentId, data.locationId, tx)
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: categoryUniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw CategoryError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created menu category "${data.name}"`,
				newValues: { name: data.name, locationId: data.locationId },
				locationId: data.locationId,
			})
			return written
		})
	}

	handleUpdate(data: MenuCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)
			actor.assertCan(existing.locationId)
			if (changes.parentId) {
				await this.#assertParentLocation(changes.parentId, existing.locationId, tx)
			}
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: categoryUniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw CategoryError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated menu category "${changes.name}"`,
				newValues: changes,
				locationId: existing.locationId,
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)
			actor.assertCan(existing.locationId)
			const written = await repo.remove(id, tx)
			if (!written) throw CategoryError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted menu category "${existing.name}"`,
				locationId: existing.locationId,
			})
			return written
		})
	}

	async #assertParentLocation(parentId: number, locationId: number, tx: Db): Promise<void> {
		const parent = await this.deps.repo.findById(parentId, tx)
		if (!parent || parent.locationId !== locationId) throw CategoryError.invalidParent()
	}
}

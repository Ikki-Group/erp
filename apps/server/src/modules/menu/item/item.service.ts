import type { Db } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { CategoryService } from '../category/category.service.ts'
import { ItemError } from './item.internal.ts'
import type { ItemRepo } from './item.repo.ts'
import type {
	MenuItemCreateDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemUpdateDto,
} from '@ikki/contract/menu/item'

interface Deps extends Infra {
	repo: ItemRepo
	category: Pick<CategoryService, 'getById'>
}

const AUDIT = { module: 'menu', entity: 'menu_item' } as const

export class ItemService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number, db?: Db): Promise<MenuItemDto> {
		const item = await this.deps.repo.findById(id, db)
		if (!item) throw ItemError.notFound(id)
		return item
	}

	handleList(filter: MenuItemFilterDto): Promise<WithPaginationResult<MenuItemDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: MenuItemCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			if (data.categoryId) await this.#assertCategoryLocation(data.categoryId, data.locationId, tx)
			await this.#assertSkuFree(data.sku, data.locationId, undefined, tx)
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw ItemError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created menu item "${data.name}" (SKU: ${data.sku})`,
				newValues: { sku: data.sku, name: data.name, locationId: data.locationId },
				locationId: data.locationId,
			})
			return written
		})
	}

	handleUpdate(data: MenuItemUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			actor.assertCan(existing.locationId)
			if (changes.categoryId) {
				await this.#assertCategoryLocation(changes.categoryId, existing.locationId, tx)
			}
			if (changes.sku !== existing.sku) {
				await this.#assertSkuFree(changes.sku, existing.locationId, id, tx)
			}
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw ItemError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated menu item "${changes.name}"`,
				newValues: changes,
				locationId: existing.locationId,
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await this.handleGetById(id, tx)
			actor.assertCan(existing.locationId)
			const written = await repo.remove(id, tx)
			if (!written) throw ItemError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted menu item "${existing.name}" (SKU: ${existing.sku})`,
				locationId: existing.locationId,
			})
			return written
		})
	}

	async #assertSkuFree(
		sku: string,
		locationId: number,
		excludeId: number | undefined,
		tx: Db,
	): Promise<void> {
		const existing = await this.deps.repo.findBySkuAndLocation(sku, locationId, tx)
		if (existing && existing.id !== excludeId) throw ItemError.skuExists(sku)
	}

	async #assertCategoryLocation(categoryId: number, locationId: number, tx: Db): Promise<void> {
		const category = await this.deps.category.getById(categoryId, tx)
		if (!category || category.locationId !== locationId) throw ItemError.invalidCategory()
	}
}

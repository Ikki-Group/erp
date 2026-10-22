import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CategoryService } from '../category/category.service.ts'
import type {
	MenuItemCreateDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemUpdateDto,
} from './item.contract.ts'
import { ItemError } from './item.internal.ts'
import type { IItemRepo } from './item.repo.ts'

// ─── Service ───

export class ItemService {
	private readonly cache: CacheService
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: IItemRepo,
		cacheClient: CacheClient,
		private readonly categoryService: CategoryService,
		uow: UnitOfWork,
		audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-item')
		this.mutation = { uow, audit, module: 'menu', entity: 'menu_item', invalidate: this.cache }
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<MenuItemDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number, actor: Actor): Promise<MenuItemDto> {
		const item = assertFound(await this.getById(id), () => ItemError.notFound(id))
		actor.assertCan(item.locationId)
		return item
	}

	async handleList(filter: MenuItemFilterDto): Promise<WithPaginationResult<MenuItemDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MenuItemCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate categoryId belongs to same location
		if (data.categoryId) {
			await this.#validateCategoryLocation(data.categoryId, data.locationId)
		}

		// 2. Create and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			await this.#checkSkuConflict(data.sku, data.locationId, undefined, tx)

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw ItemError.createFailed()

			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created menu item "${data.name}" (SKU: ${data.sku})`,
					newValues: { sku: data.sku, name: data.name, locationId: data.locationId },
				},
			}
		})
	}

	async handleUpdate(data: MenuItemUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id, actor)

		// 2. Validate categoryId belongs to same location
		if (updateData.categoryId) {
			await this.#validateCategoryLocation(updateData.categoryId, existing.locationId)
		}

		// 3. Update and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			if (updateData.sku && updateData.sku !== existing.sku) {
				await this.#checkSkuConflict(updateData.sku, existing.locationId, id, tx)
			}

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw ItemError.updateFailed(id)

			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated menu item "${updateData.name ?? existing.name}"`,
					newValues: updateData,
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id, actor)

		// 2. Delete and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw ItemError.deleteFailed(id)

			return {
				result: written,
				audit: {
					action: 'delete',
					summary: `Deleted menu item "${existing.name}" (SKU: ${existing.sku})`,
				},
			}
		})
	}

	// ─── Private ───

	async #checkSkuConflict(
		sku: string,
		locationId: number,
		excludeId?: number,
		db?: DbContext,
	): Promise<void> {
		const existing = await this.repo.findBySkuAndLocation(sku, locationId, db)
		if (existing && existing.id !== excludeId) {
			throw ItemError.skuExists(sku)
		}
	}

	async #validateCategoryLocation(categoryId: number, locationId: number): Promise<void> {
		const category = await this.categoryService.getById(categoryId)
		if (!category || category.locationId !== locationId) {
			throw ItemError.invalidCategory()
		}
	}
}

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { CategoryService } from '../category/category.service.ts'
import type {
	MenuItemCreateDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemUpdateDto,
} from './item.contract.ts'
import type { IItemRepo } from './item.repo.ts'

// ─── Error Factories ───

const ItemError = {
	notFound: (id: number) =>
		new NotFoundError('Menu item not found', {
			code: 'MENU_ITEM_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Menu item creation failed', {
			code: 'MENU_ITEM_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Menu item update failed', {
			code: 'MENU_ITEM_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Menu item deletion failed', {
			code: 'MENU_ITEM_DELETE_FAILED',
			context: { id },
		}),
	skuExists: (sku: string) =>
		new ConflictError('SKU already exists at this location', {
			code: 'MENU_ITEM_SKU_EXISTS',
			context: { sku },
		}),
	invalidCategory: () =>
		new BadRequestError('Category must belong to the same location', {
			code: 'MENU_ITEM_INVALID_CATEGORY',
		}),
}

// ─── Service ───

export class ItemService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IItemRepo,
		cacheClient: CacheClient,
		private readonly categoryService: CategoryService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-item')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<MenuItemDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<MenuItemDto> {
		return assertFound(await this.getById(id), () => ItemError.notFound(id))
	}

	async handleList(filter: MenuItemFilterDto): Promise<WithPaginationResult<MenuItemDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MenuItemCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check SKU uniqueness within location
		await this.#checkSkuConflict(data.sku, data.locationId)

		// 2. Validate categoryId belongs to same location
		if (data.categoryId) {
			await this.#validateCategoryLocation(data.categoryId, data.locationId)
		}

		// 3. Insert
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw ItemError.createFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_item',
			entityId: result.id,
			action: 'create',
			summary: `Created menu item "${data.name}" (SKU: ${data.sku})`,
			newValues: { sku: data.sku, name: data.name, locationId: data.locationId },
		})

		return result
	}

	async handleUpdate(data: MenuItemUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Check SKU uniqueness within location (if SKU changed)
		if (updateData.sku && updateData.sku !== existing.sku) {
			await this.#checkSkuConflict(updateData.sku, existing.locationId, id)
		}

		// 3. Validate categoryId belongs to same location
		if (updateData.categoryId) {
			await this.#validateCategoryLocation(updateData.categoryId, existing.locationId)
		}

		// 4. Update
		const result = await this.repo.update(id, { ...updateData, ...stampUpdate(actorId) })
		if (!result) throw ItemError.updateFailed(id)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_item',
			entityId: id,
			action: 'update',
			summary: `Updated menu item "${updateData.name ?? existing.name}"`,
			newValues: updateData,
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete
		const result = await this.repo.remove(id)
		if (!result) throw ItemError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_item',
			entityId: id,
			action: 'delete',
			summary: `Deleted menu item "${existing.name}" (SKU: ${existing.sku})`,
		})

		return result
	}

	// ─── Private ───

	async #checkSkuConflict(sku: string, locationId: number, excludeId?: number): Promise<void> {
		const existing = await this.repo.findBySkuAndLocation(sku, locationId)
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

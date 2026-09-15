import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error.ts'
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
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
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

	async handleCreate(data: MenuItemCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate categoryId belongs to same location
		if (data.categoryId) {
			await this.#validateCategoryLocation(data.categoryId, data.locationId)
		}

		// 2. Create and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			await this.#checkSkuConflict(data.sku, data.locationId, undefined, tx)

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw ItemError.createFailed()

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_item',
					entityId: written.id,
					action: 'create',
					summary: `Created menu item "${data.name}" (SKU: ${data.sku})`,
					newValues: { sku: data.sku, name: data.name, locationId: data.locationId },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: MenuItemUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Validate categoryId belongs to same location
		if (updateData.categoryId) {
			await this.#validateCategoryLocation(updateData.categoryId, existing.locationId)
		}

		// 3. Update and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			if (updateData.sku && updateData.sku !== existing.sku) {
				await this.#checkSkuConflict(updateData.sku, existing.locationId, id, tx)
			}

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw ItemError.updateFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_item',
					entityId: id,
					action: 'update',
					summary: `Updated menu item "${updateData.name ?? existing.name}"`,
					newValues: updateData,
				}),
				tx,
			)
			return written
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
			if (!written) throw ItemError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_item',
					entityId: id,
					action: 'delete',
					summary: `Deleted menu item "${existing.name}" (SKU: ${existing.sku})`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
		return result
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

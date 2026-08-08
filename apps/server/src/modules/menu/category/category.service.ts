import { menuCategories } from '@/db/schema/menu.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from './category.contract.ts'
import type { ICategoryRepo } from './category.repo.ts'

// ─── Error Factories ───

const CategoryError = {
	notFound: (id: number) =>
		new NotFoundError('Menu category not found', {
			code: 'MENU_CATEGORY_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Menu category creation failed', {
			code: 'MENU_CATEGORY_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Menu category update failed', {
			code: 'MENU_CATEGORY_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Menu category deletion failed', {
			code: 'MENU_CATEGORY_DELETE_FAILED',
			context: { id },
		}),
	invalidParent: () =>
		new BadRequestError('Parent category must belong to the same location', {
			code: 'MENU_CATEGORY_INVALID_PARENT',
		}),
}

// ─── Unique Constraint Fields ───

const uniqueFields = defineConflictFields<MenuCategoryCreateDto>()([
	{
		field: 'name',
		column: menuCategories.name,
		message: 'Menu category name already exists at this location',
		code: 'MENU_CATEGORY_NAME_EXISTS',
	},
])

// ─── Service ───

export class CategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-category')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<MenuCategoryDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByLocation(locationId: number): Promise<MenuCategoryDto[]> {
		return this.cache.getOrSet({
			key: `${this.cache.namespace}:location:${locationId}`,
			factory: () => this.repo.findByLocation(locationId),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<MenuCategoryDto> {
		return assertFound(await this.getById(id), () => CategoryError.notFound(id))
	}

	async handleList(filter: MenuCategoryFilterDto): Promise<WithPaginationResult<MenuCategoryDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MenuCategoryCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate parentId belongs to same location
		if (data.parentId) {
			await this.#validateParentLocation(data.parentId, data.locationId)
		}

		// 2. Check conflicts (name unique within location)
		await checkConflict({
			db: this.repo.db,
			table: menuCategories,
			pkColumn: menuCategories.id,
			fields: uniqueFields,
			input: data,
		})

		// 3. Insert
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw CategoryError.createFailed()

		// 4. Invalidate cache
		await this.cache.invalidateStandard()

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_category',
			entityId: result.id,
			action: 'create',
			summary: `Created menu category "${data.name}"`,
			newValues: { name: data.name, locationId: data.locationId },
		})

		return result
	}

	async handleUpdate(data: MenuCategoryUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Validate parentId belongs to same location
		if (updateData.parentId) {
			await this.#validateParentLocation(updateData.parentId, existing.locationId)
		}

		// 3. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: menuCategories,
			pkColumn: menuCategories.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 4. Update
		const result = await this.repo.update(id, { ...updateData, ...stampUpdate(actorId) })
		if (!result) throw CategoryError.updateFailed(id)

		// 5. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_category',
			entityId: id,
			action: 'update',
			summary: `Updated menu category "${updateData.name ?? existing.name}"`,
			newValues: updateData,
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete
		const result = await this.repo.remove(id)
		if (!result) throw CategoryError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'menu',
			entity: 'menu_category',
			entityId: id,
			action: 'delete',
			summary: `Deleted menu category "${existing.name}"`,
		})

		return result
	}

	// ─── Private ───

	async #validateParentLocation(parentId: number, locationId: number): Promise<void> {
		const parent = await this.repo.findById(parentId)
		if (!parent || parent.locationId !== locationId) {
			throw CategoryError.invalidParent()
		}
	}
}

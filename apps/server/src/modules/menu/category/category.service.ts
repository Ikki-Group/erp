import { menuCategories } from '@/db/schema/menu.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
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
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
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

	async handleCreate(data: MenuCategoryCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate parentId belongs to same location
		if (data.parentId) {
			await this.#validateParentLocation(data.parentId, data.locationId)
		}

		// 2. Create and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw CategoryError.createFailed()

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_category',
					entityId: written.id,
					action: 'create',
					summary: `Created menu category "${data.name}"`,
					newValues: { name: data.name, locationId: data.locationId },
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: MenuCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Validate parentId belongs to same location
		if (updateData.parentId) {
			await this.#validateParentLocation(updateData.parentId, existing.locationId)
		}

		// 3. Update and audit in one transaction
		const result = await this.uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw CategoryError.updateFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_category',
					entityId: id,
					action: 'update',
					summary: `Updated menu category "${updateData.name ?? existing.name}"`,
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
			if (!written) throw CategoryError.deleteFailed(id)

			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_category',
					entityId: id,
					action: 'delete',
					summary: `Deleted menu category "${existing.name}"`,
				}),
				tx,
			)
			return written
		})

		await this.cache.invalidateStandard(id)
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

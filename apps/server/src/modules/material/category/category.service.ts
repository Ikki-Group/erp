import { materialCategories } from '@/db/schema/material.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from './category.contract.ts'
import type { ICategoryRepo } from './category.repo.ts'

// ─── Error Factories ───

const CategoryError = {
	notFound: (id: number) =>
		new NotFoundError('Material category not found', {
			code: 'MATERIAL_CATEGORY_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Material category creation failed', {
			code: 'MATERIAL_CATEGORY_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Material category update failed', {
			code: 'MATERIAL_CATEGORY_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Material category deletion failed', {
			code: 'MATERIAL_CATEGORY_DELETE_FAILED',
			context: { id },
		}),
}

// ─── Unique Constraint Fields ───

const uniqueFields = defineConflictFields<MaterialCategoryCreateDto>()([
	{
		field: 'name',
		column: materialCategories.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_EXISTS',
	},
])

// ─── Service ───

export class CategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material-category')
	}

	// ─── Cached Reads ───

	async getAll(): Promise<MaterialCategoryDto[]> {
		return this.cache.getOrSet({
			key: this.cache.keys.list,
			factory: () => this.repo.findMany(),
		})
	}

	async getById(id: number): Promise<MaterialCategoryDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<MaterialCategoryDto> {
		return assertFound(await this.getById(id), () => CategoryError.notFound(id))
	}

	async handleList(
		filter: MaterialCategoryFilterDto,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MaterialCategoryCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: materialCategories,
			pkColumn: materialCategories.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw CategoryError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material_category',
			entityId: result.id,
			action: 'create',
			summary: `Created material category "${data.name}"`,
			newValues: { name: data.name },
		})

		return result
	}

	async handleUpdate(data: MaterialCategoryUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: materialCategories,
			pkColumn: materialCategories.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, { ...updateData, ...stampUpdate(actorId) })
		if (!result) throw CategoryError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material_category',
			entityId: id,
			action: 'update',
			summary: `Updated material category "${data.name}"`,
			newValues: { name: data.name },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Delete (FK SET NULL on materials.category_id)
		const result = await this.repo.remove(id)
		if (!result) throw CategoryError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material_category',
			entityId: id,
			action: 'delete',
			summary: `Deleted material category "${existing.name}"`,
		})

		return result
	}
}

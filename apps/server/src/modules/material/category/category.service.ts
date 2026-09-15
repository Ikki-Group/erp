import { materialCategories } from '@/db/schema/material.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
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

export interface CategoryServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class CategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICategoryRepo,
		cacheClient: CacheClient,
		private readonly deps: CategoryServiceDeps,
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

	async handleCreate(data: MaterialCategoryCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Check conflicts
			await checkConflict({
				db: tx,
				table: materialCategories,
				pkColumn: materialCategories.id,
				fields: uniqueFields,
				input: data,
			})

			// 2. Insert
			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw CategoryError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material_category',
					entityId: written.id,
					action: 'create',
					summary: `Created material category "${data.name}"`,
					newValues: { name: data.name },
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: MaterialCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)

			// 2. Check conflicts (exclude self)
			await checkConflict({
				db: tx,
				table: materialCategories,
				pkColumn: materialCategories.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			// 3. Update
			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw CategoryError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material_category',
					entityId: id,
					action: 'update',
					summary: `Updated material category "${data.name}"`,
					oldValues: { name: existing.name },
					newValues: { name: data.name },
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)

			// 2. Delete (FK SET NULL on materials.category_id)
			const written = await this.repo.remove(id, tx)
			if (!written) throw CategoryError.deleteFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'material',
					entity: 'material_category',
					entityId: id,
					action: 'delete',
					summary: `Deleted material category "${existing.name}"`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}
}

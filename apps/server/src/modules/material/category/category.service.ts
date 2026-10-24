import { materialCategories } from '@/db/schema/material.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
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
import { CategoryError, uniqueFields } from './category.internal.ts'
import type { ICategoryRepo } from './category.repo.ts'

// ─── Service ───

export interface CategoryServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class CategoryService {
	private readonly cache: CacheService
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: ICategoryRepo,
		cacheClient: CacheClient,
		deps: CategoryServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material-category')
		this.mutation = {
			uow: deps.uow,
			audit: deps.audit,
			module: 'material',
			entity: 'material_category',
			invalidate: this.cache,
		}
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
		return mutate(this.mutation, actor, async (tx) => {
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

			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created material category "${data.name}"`,
					newValues: { name: data.name },
				},
			}
		})
	}

	async handleUpdate(data: MaterialCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		return mutate(this.mutation, actor, async (tx) => {
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

			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated material category "${data.name}"`,
					oldValues: { name: existing.name },
					newValues: { name: data.name },
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		return mutate(this.mutation, actor, async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw CategoryError.notFound(id)

			// 2. Delete (FK SET NULL on materials.category_id)
			const written = await this.repo.remove(id, tx)
			if (!written) throw CategoryError.deleteFailed(id)

			return {
				result: written,
				audit: {
					action: 'delete',
					summary: `Deleted material category "${existing.name}"`,
				},
			}
		})
	}
}

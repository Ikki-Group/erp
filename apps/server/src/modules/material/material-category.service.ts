import { record } from '@elysiajs/opentelemetry'

import { CacheServiceV2, type CacheClient } from '@/core/cache'
import { RelationMap } from '@/core/utils/relation-map'

import { materialCategoriesTable } from '@/db/schema'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/infra/database'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/types/utils'

import { MaterialCategoryRepo } from './material-category.repo'
import type {
	MaterialCategorySchema,
	MaterialCategoryMutationSchema,
	MaterialCategoryFilterSchema,
} from './material-category.schema'

const uniqueFields: ConflictField<'name'>[] = [
	{
		field: 'name',
		column: materialCategoriesTable.name,
		message: 'Category name already exists',
		code: 'CATEGORY_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError('Category not found', { code: 'CATEGORY_NOT_FOUND', meta: { id } }),
	createFailed: () =>
		new InternalServerError('Category creation failed', { code: 'CATEGORY_CREATE_FAILED' }),
}

export class MaterialCategoryService {
	private readonly cache: CacheServiceV2

	constructor(
		private readonly repo: MaterialCategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheServiceV2.createWithDefaultKeys(cacheClient, 'material.category')
	}

	async getListAll(): Promise<MaterialCategorySchema[]> {
		return record('MaterialCategoryService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, MaterialCategorySchema>> {
		return record('MaterialCategoryService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async getById(id: number): Promise<MaterialCategorySchema | undefined> {
		return record('MaterialCategoryService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async create(data: MaterialCategoryMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('MaterialCategoryService.create', async () => {
			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(
		id: number,
		data: MaterialCategoryMutationSchema,
		actorId: ActorId,
	): Promise<{ id: number }> {
		return record('MaterialCategoryService.update', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	async remove(id: number): Promise<EntityRef> {
		return record('MaterialCategoryService.remove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: MaterialCategoryFilterSchema,
	): Promise<WithPaginationResult<MaterialCategorySchema>> {
		return record('MaterialCategoryService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<MaterialCategorySchema> {
		return record('MaterialCategoryService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: MaterialCategoryMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('MaterialCategoryService.handleCreate', async () => {
			return this.create(data, actorId)
		})
	}

	async handleUpdate(
		id: number,
		data: MaterialCategoryMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('MaterialCategoryService.handleUpdate', async () => {
			return this.update(id, data, actorId)
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('MaterialCategoryService.handleRemove', async () => {
			return this.remove(id)
		})
	}
}

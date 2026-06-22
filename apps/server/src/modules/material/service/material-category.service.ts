import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { RelationMap } from '@/shared/utils'

import { materialCategoriesTable } from '@/db/schema'

import { checkConflict, type ConflictField } from '@/infra/database'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { MaterialCategory } from '../domain/material-category.entity'
import type { CategoryFilter, IMaterialCategoryRepo } from '../domain/ports'
import { MATERIAL_CACHE_NS } from '../material.constants'
import { CategoryErrors } from '../material.errors'

/* -------------------------------- CONSTANTS -------------------------------- */

const UNIQUE_FIELDS: ConflictField<{ name: string }>[] = [
	{
		field: 'name',
		column: materialCategoriesTable.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialCategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: { repo: IMaterialCategoryRepo },
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, MATERIAL_CACHE_NS.CATEGORY)
	}

	/* ======================== PUBLIC API ======================== */

	async findAll(): Promise<MaterialCategory[]> {
		return record('MaterialCategoryService.findAll', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.deps.repo.getList(),
			})
		})
	}

	async findById(id: number): Promise<MaterialCategory | undefined> {
		return record('MaterialCategoryService.findById', () => {
			return this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.deps.repo.getById(id),
			})
		})
	}

	async count(): Promise<number> {
		return record('MaterialCategoryService.count', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.deps.repo.count(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, MaterialCategory>> {
		return record('MaterialCategoryService.getRelationMap', async () => {
			const items = await this.findAll()
			return RelationMap.fromArray(items, (c) => c.id)
		})
	}

	/* ======================== USE CASES ======================== */

	async list(filter: CategoryFilter): Promise<WithPaginationResult<MaterialCategory>> {
		return record('MaterialCategoryService.list', () => {
			return this.deps.repo.getListPaginated(filter)
		})
	}

	async detail(id: number): Promise<MaterialCategory> {
		return record('MaterialCategoryService.detail', async () => {
			const result = await this.findById(id)
			if (!result) throw CategoryErrors.notFound(id)
			return result
		})
	}

	async create(
		data: {
			name: string
			description?: string | null | undefined
			parentId?: number | null | undefined
		},
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialCategoryService.create', async () => {
			const name = data.name.trim()

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: UNIQUE_FIELDS,
				input: { name },
			})

			const result = await this.deps.repo.create({ ...data, name, createdBy: actorId })

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(
		id: number,
		data: Partial<{
			name: string
			description?: string | null | undefined
			parentId?: number | null | undefined
		}>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialCategoryService.update', async () => {
			const existing = await this.findById(id)
			if (!existing) throw CategoryErrors.notFound(id)

			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: materialCategoriesTable,
				pkColumn: materialCategoriesTable.id,
				fields: UNIQUE_FIELDS,
				input: { name },
				existing,
			})

			const result = await this.deps.repo.update(id, { ...data, name, updatedBy: actorId })

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
			return result
		})
	}

	async remove(id: number): Promise<{ id: number }> {
		return record('MaterialCategoryService.remove', async () => {
			const existing = await this.findById(id)
			if (!existing) throw CategoryErrors.notFound(id)

			const result = await this.deps.repo.remove(id)
			if (!result) throw CategoryErrors.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
			return result
		})
	}
}

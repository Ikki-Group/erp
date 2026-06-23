import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { RelationMap } from '@/shared/utils'

import { materialsTable } from '@/db/schema'

import { checkConflict, type ConflictField, type DbClient, type DbTx } from '@/infra/database'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { Material, MaterialType } from '../domain/material.entity'
import type { IMaterialRepo, MaterialListFilter } from '../domain/ports'
import type { MaterialDetailDto } from '../dto/material.dto'
import { MATERIAL_CACHE_NS } from '../material.constants'
import { MasterErrors } from '../material.errors'
import type { MaterialCategoryService } from './material-category.service'
import type { MaterialConversionService } from './material-conversion.service'
import type { EntityRef } from '@/shared/types/utils'

/* -------------------------------- CONSTANTS -------------------------------- */

const UNIQUE_FIELDS: ConflictField<{ sku: string; name: string }>[] = [
	{
		field: 'sku',
		column: materialsTable.sku,
		message: 'Material SKU already exists',
		code: 'MATERIAL_SKU_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: materialsTable.name,
		message: 'Material name already exists',
		code: 'MATERIAL_NAME_ALREADY_EXISTS',
	},
]

/* ----------------------------- TYPES ----------------------------- */

interface MaterialCreateInput {
	name: string
	description?: string | null
	sku: string
	type: MaterialType
	categoryId: number
	baseUomId: number
	conversions?: { uomId: number; toBaseFactor: string | number }[]
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class MaterialService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: {
			category: MaterialCategoryService
			conversion: MaterialConversionService
			repo: IMaterialRepo
			db: DbClient
		},
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, MATERIAL_CACHE_NS.MASTER)
	}

	/* ======================== PUBLIC API (for other services) ======================== */

	async findAll(): Promise<Material[]> {
		return record('MaterialService.findAll', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.deps.repo.getList(),
			})
		})
	}

	async findById(id: number): Promise<Material | undefined> {
		return record('MaterialService.findById', () => {
			return this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.deps.repo.getById(id),
			})
		})
	}

	async findByIds(ids: number[]): Promise<Material[]> {
		return record('MaterialService.findByIds', async () => {
			if (ids.length === 0) return []
			return this.deps.repo.getByIds(ids)
		})
	}

	async getRelationMap(): Promise<RelationMap<number, Material>> {
		return record('MaterialService.getRelationMap', async () => {
			const items = await this.findAll()
			return RelationMap.fromArray(items, (m) => m.id)
		})
	}

	async count(): Promise<number> {
		return record('MaterialService.count', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.deps.repo.count(),
			})
		})
	}

	/* ======================== USE CASES (for routes) ======================== */

	async list(filter: MaterialListFilter): Promise<WithPaginationResult<Material>> {
		return record('MaterialService.list', () => {
			return this.deps.repo.getListPaginated(filter)
		})
	}

	async detail(id: number): Promise<MaterialDetailDto> {
		return record('MaterialService.detail', async () => {
			const material = await this.findById(id)
			if (!material) throw MasterErrors.notFound(id)

			const [categoryMap, conversions] = await Promise.all([
				this.deps.category.getRelationMap(),
				this.deps.conversion.findAll(id),
			])

			return {
				...material,
				category: material.categoryId ? categoryMap.getRequired(material.categoryId) : null,
				conversions,
			}
		})
	}

	async create(input: MaterialCreateInput, actorId: number): Promise<EntityRef> {
		return record('MaterialService.create', async () => {
			const { sku, name, conversions } = input

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: UNIQUE_FIELDS,
				input: { sku, name },
			})

			const created = await this.withTx(async (tx) => {
				const material = await this.deps.repo.create({
					sku,
					name,
					type: input.type,
					categoryId: input.categoryId,
					baseUomId: input.baseUomId,
					description: input.description,
					createdBy: actorId,
				})

				if (conversions && conversions.length > 0) {
					await this.deps.conversion.batchCreate(
						material.id,
						conversions.map((c) => ({
							uomId: c.uomId,
							toBaseFactor: c.toBaseFactor.toString(),
						})),
						actorId,
						tx,
					)
				}

				return material
			})

			await this.invalidateListCache()
			return created
		})
	}

	async update(id: number, input: MaterialCreateInput, actorId: number): Promise<EntityRef> {
		return record('MaterialService.update', async () => {
			const { sku, name, conversions } = input

			const existing = await this.findById(id)
			if (!existing) throw MasterErrors.notFound(id)

			await checkConflict({
				table: materialsTable,
				pkColumn: materialsTable.id,
				fields: UNIQUE_FIELDS,
				input: { sku, name },
				existing,
			})

			await this.withTx(async (tx) => {
				await this.deps.repo.update(id, {
					sku,
					name,
					type: input.type,
					categoryId: input.categoryId,
					baseUomId: input.baseUomId,
					description: input.description,
					updatedBy: actorId,
				})

				if (conversions !== undefined) {
					await this.deps.conversion.batchReplace(
						id,
						conversions.map((c) => ({
							uomId: c.uomId,
							toBaseFactor: c.toBaseFactor.toString(),
						})),
						actorId,
						tx,
					)
				}
			})

			await this.invalidateItemCache(id)
			return { id }
		})
	}

	async remove(id: number): Promise<EntityRef> {
		return record('MaterialService.remove', async () => {
			const existing = await this.findById(id)
			if (!existing) throw MasterErrors.notFound(id)

			const result = await this.deps.repo.remove(id)
			if (!result) throw MasterErrors.notFound(id)

			await this.invalidateItemCache(id)
			return { id: result }
		})
	}

	/* ======================== PRIVATE ======================== */

	private async withTx<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
		return this.deps.db.transaction(fn)
	}

	private async invalidateListCache(): Promise<void> {
		await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
	}

	private async invalidateItemCache(id: number): Promise<void> {
		await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
	}
}

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbClient, DbTx } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import { MATERIAL_CACHE_NS } from '../material.constants'
import { ConversionErrors } from '../material.errors'
import type { MaterialConversion } from './conversion.contract'
import type {
	ConversionFilter,
	ConversionInsertData,
	ConversionUpdateData,
	IMaterialConversionRepo,
} from './conversion.repo'

export class MaterialConversionService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: {
			repo: IMaterialConversionRepo
			db: DbClient
		},
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, MATERIAL_CACHE_NS.CONVERSION)
	}

	/* ======================== PUBLIC API ======================== */

	async findAll(materialId?: number): Promise<MaterialConversion[]> {
		return record('MaterialConversionService.findAll', () => {
			return this.cache.getOrSet({
				key: `list:${materialId ?? 'all'}`,
				factory: () => this.deps.repo.getList(materialId),
			})
		})
	}

	async findById(id: number): Promise<MaterialConversion | undefined> {
		return record('MaterialConversionService.findById', () => {
			return this.cache.getOrSetWithSkip({
				key: `byId:${id}`,
				factory: () => this.deps.repo.getById(id),
			})
		})
	}

	async batchCreate(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialConversionService.batchCreate', () => {
			return this.deps.repo.batchCreate(materialId, conversions, actorId, tx ?? this.deps.db)
		})
	}

	async batchReplace(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialConversionService.batchReplace', () => {
			return this.deps.repo.batchReplace(materialId, conversions, actorId, tx ?? this.deps.db)
		})
	}

	/* ======================== USE CASES ======================== */

	async list(filter: ConversionFilter): Promise<WithPaginationResult<MaterialConversion>> {
		return record('MaterialConversionService.list', () => {
			return this.deps.repo.getListPaginated(filter)
		})
	}

	async detail(id: number): Promise<MaterialConversion> {
		return record('MaterialConversionService.detail', async () => {
			const result = await this.findById(id)
			if (!result) throw ConversionErrors.notFound(id)
			return result
		})
	}

	async handleCreate(data: ConversionInsertData, actorId: number): Promise<EntityRef> {
		return record('MaterialConversionService.handleCreate', async () => {
			const existing = await this.deps.repo.getByMaterialAndUom(data.materialId, data.uomId)
			if (existing) throw ConversionErrors.uomAlreadyExists()

			const result = await this.deps.repo.create(data, actorId)
			if (!result) throw ConversionErrors.createFailed()

			await this.invalidateCache(data.materialId)
			return result
		})
	}

	async handleUpdate(data: ConversionUpdateData, actorId: number): Promise<EntityRef> {
		return record('MaterialConversionService.handleUpdate', async () => {
			const current = await this.findById(data.id)
			if (!current) throw ConversionErrors.notFound(data.id)

			if (current.materialId !== data.materialId || current.uomId !== data.uomId) {
				const dup = await this.deps.repo.getByMaterialAndUom(data.materialId, data.uomId)
				if (dup && dup.id !== data.id) throw ConversionErrors.uomAlreadyExists()
			}

			const result = await this.deps.repo.update(data, actorId)
			if (!result) throw ConversionErrors.notFound(data.id)

			await this.invalidateCache(data.materialId, current.materialId, data.id)
			return { id: data.id }
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('MaterialConversionService.handleRemove', async () => {
			const current = await this.findById(id)
			if (!current) throw ConversionErrors.notFound(id)

			const result = await this.deps.repo.remove(id)
			if (!result) throw ConversionErrors.notFound(id)

			await this.invalidateCache(current.materialId, undefined, id)
			return { id }
		})
	}

	/* ======================== PRIVATE ======================== */

	private async invalidateCache(
		materialId: number,
		oldMaterialId?: number,
		itemId?: number,
	): Promise<void> {
		const keys = [`list:${materialId}`, 'list:all']
		if (oldMaterialId && oldMaterialId !== materialId) {
			keys.push(`list:${oldMaterialId}`)
		}
		if (itemId) keys.push(`byId:${itemId}`)
		await this.cache.deleteFromKeys(keys)
	}
}

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/core/cache'
import type { DbTx } from '@/core/database'
import type { WithPaginationResult } from '@/core/database/pagination'
import { ConflictError, InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'

import * as dto from './material-conversion.dto'
import { MaterialConversionRepo } from './material-conversion.repo'
import type { RecordId } from '@ikki/api-contract'

const err = {
	notFound: (id: number) =>
		new NotFoundError(
			`Material conversion with ID ${id} not found`,
			'MATERIAL_CONVERSION_NOT_FOUND',
		),
	createFailed: () =>
		new InternalServerError(
			'Material conversion creation failed',
			'MATERIAL_CONVERSION_CREATE_FAILED',
		),
	conflictUom: () =>
		new ConflictError(
			'Material conversion for this UOM already exists',
			'MATERIAL_CONVERSION_UOM_ALREADY_EXISTS',
		),
}

export class MaterialConversionService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: MaterialConversionRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'material.conversion', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(materialId?: number): Promise<dto.MaterialConversionDto[]> {
		return record('MaterialConversionService.getList', () => {
			return this.cache.getOrSet({
				key: `list:${materialId ?? 'all'}`,
				factory: () => this.repo.getList(materialId),
			})
		})
	}

	async getRelationMap(
		materialId?: number,
	): Promise<RelationMap<number, dto.MaterialConversionDto>> {
		return record('MaterialConversionService.getRelationMap', async () => {
			const conversions = await this.getList(materialId)
			return RelationMap.fromArray(conversions, (c) => c.id)
		})
	}

	async getById(id: number): Promise<dto.MaterialConversionDto | undefined> {
		return record('MaterialConversionService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.MaterialConversionFilterDto,
	): Promise<WithPaginationResult<dto.MaterialConversionDto>> {
		return record('MaterialConversionService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.MaterialConversionDto> {
		return record('MaterialConversionService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.MaterialConversionCreateDto, actorId: number): Promise<RecordId> {
		return record('MaterialConversionService.handleCreate', async () => {
			const existing = await this.repo.getByMaterialAndUom(data.materialId, data.uomId)
			if (existing) throw err.conflictUom()

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: [`list:${data.materialId}`, 'list:all'] })

			return { id: result }
		})
	}

	async handleUpdate(data: dto.MaterialConversionUpdateDto, actorId: number): Promise<RecordId> {
		return record('MaterialConversionService.handleUpdate', async () => {
			const { id } = data

			const current = await this.getById(id)
			if (!current) throw err.notFound(id)

			if (current.materialId !== data.materialId || current.uomId !== data.uomId) {
				const existing = await this.repo.getByMaterialAndUom(data.materialId, data.uomId)
				if (existing && existing.id !== id) throw err.conflictUom()
			}

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({
				keys: [`list:${data.materialId}`, `list:${current.materialId}`, 'list:all', `byId:${id}`],
			})

			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('MaterialConversionService.handleRemove', async () => {
			const current = await this.getById(id)
			if (!current) throw err.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({
				keys: [`list:${current.materialId}`, 'list:all', `byId:${id}`],
			})

			return { id }
		})
	}

	async batchCreate(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialConversionService.batchCreate', async () => {
			await this.repo.batchCreate(materialId, conversions, actorId, tx ?? this.db)
		})
	}

	async batchReplace(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialConversionService.batchReplace', async () => {
			await this.repo.batchReplace(materialId, conversions, actorId, tx ?? this.db)
		})
	}
}

/**
 * Material UOM Service — Unit of Measurement operations
 */

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/core/cache'
import type { DbClient, DbTx } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'

import { MaterialUomRepository } from './material-uom.repo'
import type {
	MaterialUomSchema,
	MaterialUomMutationSchema,
	MaterialUomFilterSchema,
} from './material-uom.schema'

export const MaterialUomErrors = {
	notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`, 'UOM_NOT_FOUND'),
	createFailed: () => new ConflictError('UOM creation failed', 'UOM_CREATE_FAILED'),
	conflictCode: (code: string) =>
		new ConflictError(`UOM code ${code} already exists`, 'UOM_CODE_ALREADY_EXISTS'),
}

export class MaterialUomService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: {
			repo: MaterialUomRepository
			db: DbClient
		},
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({
			ns: 'material:uom',
			client: cacheClient,
		})
	}

	/** Get UOM by ID */
	async findById(id: number): Promise<MaterialUomSchema | undefined> {
		return record('MaterialUomService.findById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.deps.repo.findById(id),
			})
		})
	}

	/** Get UOMs with filtering and pagination */
	async findMany(filter: MaterialUomFilterSchema) {
		return record('MaterialUomService.findMany', async () => {
			const { pagination, q } = filter

			const cacheKey = `list:${JSON.stringify({
				q,
				limit: pagination.limit,
				offset: pagination.offset,
			})}`

			return this.cache.getOrSet({
				key: cacheKey,
				factory: () => this.deps.repo.findMany(filter),
			})
		})
	}

	/** Get all UOMs for relation mapping */
	async getRelationMap() {
		return record('MaterialUomService.getRelationMap', async () => {
			return this.cache.getOrSet({
				key: 'relationMap',
				factory: async () => {
					const items = await this.deps.repo.findAll()
					const map = new Map<number, MaterialUomSchema>()
					items.forEach((item) => map.set(item.id, item))
					return map
				},
			})
		})
	}

	/** Create new UOM */
	async create(data: MaterialUomMutationSchema, actorId: number): Promise<{ id: number }> {
		return record('MaterialUomService.create', async () => {
			const existing = await this.deps.repo.findByCode(data.code)
			if (existing) throw MaterialUomErrors.conflictCode(data.code)

			const result = await this.deps.repo.create(data, actorId)
			if (!result) throw MaterialUomErrors.createFailed()

			await this.cache.deleteMany({
				keys: ['list:*', 'relationMap'],
			})

			return { id: result }
		})
	}

	/** Update existing UOM */
	async update(
		id: number,
		data: MaterialUomMutationSchema,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialUomService.update', async () => {
			const existing = await this.findById(id)
			if (!existing) throw MaterialUomErrors.notFound(id)

			const codeConflict = await this.deps.repo.findByCode(data.code)
			if (codeConflict && codeConflict.id !== id) {
				throw MaterialUomErrors.conflictCode(data.code)
			}

			const result = await this.deps.repo.update(id, data, actorId)
			if (!result) throw MaterialUomErrors.notFound(id)

			await this.cache.deleteMany({
				keys: [`byId:${id}`, 'list:*', 'relationMap'],
			})

			return { id: result }
		})
	}

	/** Delete UOM */
	async remove(id: number): Promise<{ id: number }> {
		return record('MaterialUomService.remove', async () => {
			const existing = await this.findById(id)
			if (!existing) throw MaterialUomErrors.notFound(id)

			const result = await this.deps.repo.remove(id)
			if (!result) throw MaterialUomErrors.notFound(id)

			await this.cache.deleteMany({
				keys: [`byId:${id}`, 'list:*', 'relationMap'],
			})

			return { id: result }
		})
	}
}

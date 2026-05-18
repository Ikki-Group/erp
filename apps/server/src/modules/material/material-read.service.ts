/**
 * Material Read Service — Query operations with caching
 */

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/core/cache'

import type { DbClient } from '@/infra/database'

import { MaterialReadRepository } from './material-read.repo'
import type {
	MaterialReadFilterSchema,
	MaterialReadDetailSchema,
	MaterialReadWithRelationsSchema,
} from './material-read.schema'

export class MaterialReadService {
	private readonly cache: CacheService
	private readonly repo: MaterialReadRepository

	constructor(
		private readonly db: DbClient,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({
			ns: 'material:read',
			client: cacheClient,
		})
		this.repo = new MaterialReadRepository(this.db)
	}

	/** Get single material by ID */
	async findById(id: number): Promise<MaterialReadDetailSchema | undefined> {
		return record('MaterialReadService.findById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.findById(id),
			})
		})
	}

	/** Get materials with filtering and pagination */
	async findMany(filter: MaterialReadFilterSchema) {
		return record('MaterialReadService.findMany', async () => {
			const { pagination, search, type, categoryId, locationIds, excludeLocationIds } = filter

			const cacheKey = `list:${JSON.stringify({
				search,
				type,
				categoryId,
				locationIds,
				excludeLocationIds,
				limit: pagination.limit,
				offset: pagination.offset,
			})}`

			return this.cache.getOrSet({
				key: cacheKey,
				factory: () => this.repo.findMany(filter),
			})
		})
	}

	/** Get material with all relations (category, conversions, locations) */
	async findWithRelations(id: number): Promise<MaterialReadWithRelationsSchema | undefined> {
		return record('MaterialReadService.findWithRelations', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `withRelations:${id}`,
				factory: () => this.repo.findWithRelations(id),
			})
		})
	}

	/** Get count of materials matching filter */
	async count(filter: Omit<MaterialReadFilterSchema, 'pagination'>): Promise<number> {
		return record('MaterialReadService.count', async () => {
			const cacheKey = `count:${JSON.stringify(filter)}`

			return this.cache.getOrSet({
				key: cacheKey,
				factory: async () => {
					// Simple count query
					const result = await this.db.select({ count: materialsTable.id }).from(materialsTable)

					const conditions = []
					if (filter.search) {
						conditions.push(
							ilike(materialsTable.name, `%${filter.search}%`),
							ilike(materialsTable.sku, `%${filter.search}%`),
						)
					}

					if (filter.type) {
						conditions.push(eq(materialsTable.type, filter.type))
					}

					if (filter.categoryId) {
						conditions.push(eq(materialsTable.categoryId, filter.categoryId))
					}

					if (conditions.length > 0) {
						result.where(and(...conditions))
					}

					const data = await result
					return data.length
				},
			})
		})
	}
}

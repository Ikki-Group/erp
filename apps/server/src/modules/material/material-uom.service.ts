import { record } from '@elysiajs/opentelemetry'

import { CacheServiceV2, type CacheClient } from '@/core/cache'
import { checkConflict, type ConflictField } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'

import { uomsTable } from '@/db/schema'

import type { ActorId, EntityRef } from '@/types/utils'

import { MaterialUomRepo } from './material-uom.repo'
import type { MaterialUomSchema, MaterialUomMutationSchema } from './material-uom.schema'

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`, 'UOM_NOT_FOUND'),
	createFailed: () => new InternalServerError('UOM creation failed', 'UOM_CREATE_FAILED'),
}

export class MaterialUomService {
	private readonly cache: CacheServiceV2

	constructor(
		private readonly repo: MaterialUomRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheServiceV2.createWithDefaultKeys(cacheClient, 'material.uom')
	}

	async getById(id: number): Promise<MaterialUomSchema | undefined> {
		return record('MaterialUomService.getById', async () =>
			this.cache.getOrSetSkipUndefined(this.cache.keys.byId(id), {
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async getListAll(): Promise<MaterialUomSchema[]> {
		return record('MaterialUomService.getListAll', async () =>
			this.cache.getOrSet(this.cache.keys.list, {
				factory: () => this.repo.getList(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, MaterialUomSchema>> {
		return record('MaterialUomService.getRelationMap', async () =>
			RelationMap.fromArray(await this.repo.getList(), (v) => v.id),
		)
	}

	async create(data: MaterialUomMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('MaterialUomService.create', async () => {
			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
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
		data: MaterialUomMutationSchema,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialUomService.update', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
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
		return record('MaterialUomService.remove', async () => {
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
}

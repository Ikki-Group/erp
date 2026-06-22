import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { RelationMap } from '@/shared/utils'

import { uomsTable } from '@/db/schema'

import { checkConflict, type ConflictField } from '@/infra/database'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { IUomRepo, UomFilter } from '../domain/ports'
import type { Uom } from '../domain/uom.entity'
import { MATERIAL_CACHE_NS } from '../material.constants'
import { UomErrors } from '../material.errors'
import type { RecordId } from '@ikki/api-contract'

/* -------------------------------- CONSTANTS -------------------------------- */

const UNIQUE_FIELDS: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UomService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: { repo: IUomRepo },
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, MATERIAL_CACHE_NS.UOM)
	}

	/* ======================== PUBLIC API ======================== */

	async findAll(): Promise<Uom[]> {
		return record('UomService.findAll', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.deps.repo.getList(),
			})
		})
	}

	async findById(id: number): Promise<Uom | undefined> {
		return record('UomService.findById', () => {
			return this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.deps.repo.getById(id),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, Uom>> {
		return record('UomService.getRelationMap', async () => {
			const items = await this.findAll()
			return RelationMap.fromArray(items, (u) => u.id)
		})
	}

	async count(): Promise<number> {
		return record('UomService.count', () => {
			return this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.deps.repo.count(),
			})
		})
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		return record('UomService.seed', () => this.deps.repo.seed(data))
	}

	/* ======================== USE CASES ======================== */

	async list(filter: UomFilter): Promise<WithPaginationResult<Uom>> {
		return record('UomService.list', () => this.deps.repo.getListPaginated(filter))
	}

	async detail(id: number): Promise<Uom> {
		return record('UomService.detail', async () => {
			const result = await this.findById(id)
			if (!result) throw UomErrors.notFound(id)
			return result
		})
	}

	async create(data: { code: string }, actorId: number): Promise<{ id: number }> {
		return record('UomService.create', async () => {
			const code = data.code.toUpperCase().trim()

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: UNIQUE_FIELDS,
				input: { code },
			})

			const result = await this.deps.repo.create({ code, createdBy: actorId })
			if (!result) throw UomErrors.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return { id: result }
		})
	}

	async update(
		id: number,
		data: Partial<{ code: string }>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UomService.update', async () => {
			const existing = await this.findById(id)
			if (!existing) throw UomErrors.notFound(id)

			const code = data.code ? data.code.toUpperCase().trim() : existing.code

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: UNIQUE_FIELDS,
				input: { code },
				existing,
			})

			const result = await this.deps.repo.update(id, { code, updatedBy: actorId })
			if (!result) throw UomErrors.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
			return { id }
		})
	}

	async remove(id: number): Promise<RecordId> {
		return record('UomService.remove', async () => {
			const existing = await this.findById(id)
			if (!existing) throw UomErrors.notFound(id)

			const result = await this.deps.repo.remove(id)
			if (!result) throw UomErrors.notFound(id)

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
			return { id }
		})
	}
}

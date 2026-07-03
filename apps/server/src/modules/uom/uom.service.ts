import { record } from '@elysiajs/opentelemetry'

import { uomsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type { UomDto, UomFilterDto, UomCreateDto, UomUpdateDto } from './uom.contract'
import { UomError } from './uom.internal'
import type { IUomRepo } from './uom.repo'

const uomConflictFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

export class UomService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IUomRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'uom')
	}

	toRelationMap(items: UomDto[]): RelationMap<number, UomDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getListAll(): Promise<UomDto[]> {
		return record('UomService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async getById(id: number): Promise<UomDto | undefined> {
		return record('UomService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, UomDto>> {
		return record('UomService.getRelationMap', async () => {
			const items = await this.getListAll()
			return this.toRelationMap(items)
		})
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async seed(
		items: Pick<UomDto, 'id' | 'code' | 'createdBy'>[],
		db: DbContext,
	): Promise<void> {
		return this.repo.insertMany(
			items.map((x) => ({
				...x,
				name: x.code,
				...stampCreate(x.createdBy),
			})),
			db,
		)
	}

	async create(data: UomCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: uomsTable,
			pkColumn: uomsTable.id,
			fields: uomConflictFields,
			input: { code: data.code },
		})

		const result = await this.repo.insert({
			code: data.code,
			name: data.code,
			...stampCreate(actorId),
		})
		if (!result) throw UomError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: UomUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw UomError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: uomsTable,
			pkColumn: uomsTable.id,
			fields: uomConflictFields,
			input: { code: data.code },
			existing,
		})

		const result = await this.repo.update(id, {
			code: data.code,
			name: data.code,
			...stampUpdate(actorId),
		})
		if (!result) throw UomError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const result = await this.repo.remove(id)
		if (!result) throw UomError.notFound(id)

		await this.invalidate(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return record('UomService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<UomDto> {
		return record('UomService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw UomError.notFound(id)
			return result
		})
	}

	async handleCreate(data: UomCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UomService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: UomUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('UomService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('UomService.handleDelete', async () => this.remove(id))
	}
}

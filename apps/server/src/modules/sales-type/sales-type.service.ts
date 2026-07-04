import { record } from '@elysiajs/opentelemetry'

import { salesTypesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	SalesTypeCreateDto,
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from './sales-type.contract'
import { SalesTypeError } from './sales-type.internal'
import type { ISalesTypeRepo } from './sales-type.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: salesTypesTable.code,
		message: 'Sales type code already exists',
		code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
	},
]

export class SalesTypeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISalesTypeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales-type')
	}

	toRelationMap(items: SalesTypeDto[]): RelationMap<number, SalesTypeDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	/** Invalidate list/count caches, plus the byId cache when an id is given. */
	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getListAll(): Promise<SalesTypeDto[]> {
		return record('SalesTypeService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async getById(id: number): Promise<SalesTypeDto | undefined> {
		return record('SalesTypeService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async seed(
		items: Pick<SalesTypeDto, 'id' | 'code' | 'name' | 'isSystem' | 'createdBy'>[],
		db: DbContext,
	): Promise<void> {
		return this.repo.insertMany(
			items.map((x) => ({
				...x,
				...stampCreate(x.createdBy),
			})),
			db,
		)
	}

	async create(data: SalesTypeCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: salesTypesTable,
			pkColumn: salesTypesTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw SalesTypeError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: SalesTypeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw SalesTypeError.notFound(id)
		if (existing.isSystem) throw SalesTypeError.isSystem()

		await checkConflict({
			db: this.repo.db,
			table: salesTypesTable,
			pkColumn: salesTypesTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw SalesTypeError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw SalesTypeError.notFound(id)
		if (existing.isSystem) throw SalesTypeError.isSystem()

		const result = await this.repo.remove(id)
		if (!result) throw SalesTypeError.notFound(id)

		await this.invalidate(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw SalesTypeError.notFound(id)
			return result
		})
	}

	async handleCreate(data: SalesTypeCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesTypeService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: SalesTypeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesTypeService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('SalesTypeService.handleDelete', async () => this.remove(id))
	}
}

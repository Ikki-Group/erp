import { record } from '@elysiajs/opentelemetry'

import { suppliersTable } from '@/db/schema/supplier'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext, withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from './supplier.contract'
import { SupplierError } from './supplier.internal'
import type { ISupplierRepo } from './supplier.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: suppliersTable.code,
		message: 'Supplier code already exists',
		code: 'SUPPLIER_CODE_ALREADY_EXISTS',
	},
]

export class SupplierService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISupplierRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'supplier')
	}

	toRelationMap(items: SupplierDto[]): RelationMap<number, SupplierDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async findMany(filter?: SupplierFilterDto): Promise<SupplierDto[]> {
		return record('SupplierService.findMany', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(filter),
			}),
		)
	}

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getByIds(ids: number[]): Promise<SupplierDto[]> {
		if (ids.length === 0) return []
		return record('SupplierService.getByIds', async () => {
			const results = await this.repo.findByIds(ids)
			return results
		})
	}

	async seed(
		items: Pick<SupplierDto, 'id' | 'code' | 'name' | 'createdBy'>[],
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

	async create(data: SupplierCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: suppliersTable,
			pkColumn: suppliersTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw SupplierError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: SupplierUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw SupplierError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: suppliersTable,
			pkColumn: suppliersTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw SupplierError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number, _actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw SupplierError.notFound(id)

		const result = await withTransaction(this.repo.db, async (tx) => {
			const deleted = await this.repo.remove(id, tx)
			if (!deleted) throw SupplierError.notFound(id)
			return deleted
		})

		await this.invalidate(id)
		return result
	}

	async handleList(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<SupplierDto> {
		return record('SupplierService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw SupplierError.notFound(id)
			return result
		})
	}

	async handleCreate(data: SupplierCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: SupplierUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number, _actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleDelete', async () => this.remove(id, _actorId))
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		return this.handleDelete(id, actorId)
	}
}

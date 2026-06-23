import { record } from '@elysiajs/opentelemetry'

import { suppliersTable } from '@/db/schema/supplier'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import { SupplierRepo } from './supplier.repo'
import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from './supplier.contract'

const supplierConflictFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: suppliersTable.code,
		message: 'Supplier code already exists',
		code: 'SUPPLIER_CODE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Supplier with ID ${id} not found`, { code: 'SUPPLIER_NOT_FOUND' }),
	createFailed: () => new InternalServerError('Supplier creation failed', { code: 'SUPPLIER_CREATE_FAILED' }),
}

export class SupplierService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SupplierRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'supplier')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierService.handleList', () => this.repo.getListPaginated(filter))
	}

	async handleDetail(id: number): Promise<SupplierDto> {
		return record('SupplierService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: SupplierCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleCreate', async () => {
			await checkConflict({
				table: suppliersTable,
				pkColumn: suppliersTable.id,
				fields: supplierConflictFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])

			return result
		})
	}

	async handleUpdate(data: SupplierUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: suppliersTable,
				pkColumn: suppliersTable.id,
				fields: supplierConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('SupplierService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.remove(id, actorId)
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

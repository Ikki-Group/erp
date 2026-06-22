import { CacheService, type CacheClient } from '@/infra/cache'

import { suppliersTable } from '@/db/schema/supplier'

import { checkConflict, type ConflictField} from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/shared/types/utils'

import { SupplierRepo } from './supplier.repo'
import type {
	SupplierCreateSchema,
	SupplierSchema,
	SupplierFilterSchema,
	SupplierUpdateSchema,
} from './supplier.schema'

const supplierConflictFields: ConflictField<any>[] = [
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

	async getById(id: number): Promise<SupplierSchema | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SupplierFilterSchema): Promise<WithPaginationResult<SupplierSchema>> {
		return this.repo.getListPaginated(filter)
	}

	async handleDetail(id: number): Promise<SupplierSchema> {
		const result = await this.getById(id)
		if (!result) throw err.notFound(id)
		return result
	}

	async handleCreate(data: SupplierCreateSchema, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			table: suppliersTable,
			pkColumn: suppliersTable.id,
			fields: supplierConflictFields,
			input: data,
		})

		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}

	async handleUpdate(data: SupplierUpdateSchema, actorId: ActorId): Promise<EntityRef> {
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

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw err.notFound(id)

		const result = await this.repo.remove(id, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}
}

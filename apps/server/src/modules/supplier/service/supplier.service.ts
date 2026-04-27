import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { suppliersTable } from '@/db/schema/supplier'

import type {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from '../dto/supplier.dto'
import { SupplierRepo } from '../supplier.repo'

const supplierConflictFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: suppliersTable.code,
		message: 'Supplier code already exists',
		code: 'SUPPLIER_CODE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Supplier with ID ${id} not found`, 'SUPPLIER_NOT_FOUND'),
	createFailed: () => new InternalServerError('Supplier creation failed', 'SUPPLIER_CREATE_FAILED'),
}

export class SupplierService {
	constructor(private repo = new SupplierRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SupplierDto | undefined> {
		return record('SupplierService.getById', async () => {
			return this.repo.getById(id)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
		return record('SupplierService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<SupplierDto> {
		return record('SupplierService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: SupplierCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SupplierService.handleCreate', async () => {
			await checkConflict({
				table: suppliersTable,
				pkColumn: suppliersTable.id,
				fields: supplierConflictFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			return { id: result }
		})
	}

	async handleUpdate(data: SupplierUpdateDto, actorId: number): Promise<{ id: number }> {
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

			return { id }
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('SupplierService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}
}

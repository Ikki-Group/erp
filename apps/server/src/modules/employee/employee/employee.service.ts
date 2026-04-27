import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { employeesTable } from '@/db/schema/employee'

import type {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.dto'
import { EmployeeRepo } from './employee.repo'

const employeeConflictFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: employeesTable.code,
		message: 'Employee code already exists',
		code: 'EMPLOYEE_CODE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Employee with ID ${id} not found`, 'EMPLOYEE_NOT_FOUND'),
	createFailed: () => new InternalServerError('Employee creation failed', 'EMPLOYEE_CREATE_FAILED'),
}

export class EmployeeService {
	constructor(private repo = new EmployeeRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<EmployeeDto | undefined> {
		return record('EmployeeService.getById', async () => {
			return this.repo.getById(id)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: EmployeeFilterDto): Promise<WithPaginationResult<EmployeeDto>> {
		return record('EmployeeService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<EmployeeDto> {
		return record('EmployeeService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: EmployeeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('EmployeeService.handleCreate', async () => {
			await checkConflict({
				table: employeesTable,
				pkColumn: employeesTable.id,
				fields: employeeConflictFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			return { id: result }
		})
	}

	async handleUpdate(data: EmployeeUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('EmployeeService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: employeesTable,
				pkColumn: employeesTable.id,
				fields: employeeConflictFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('EmployeeService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}
}

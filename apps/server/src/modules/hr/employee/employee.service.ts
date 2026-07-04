import { record } from '@elysiajs/opentelemetry'

import { employeesTable } from '@/db/schema/hr'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.contract'
import { EmployeeError } from './employee.internal'
import type { IEmployeeRepo } from './employee.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: employeesTable.code,
		message: 'Employee code already exists',
		code: 'EMPLOYEE_CODE_ALREADY_EXISTS',
	},
]

export class EmployeeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IEmployeeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'employee')
	}

	toRelationMap(items: EmployeeDto[]): RelationMap<number, EmployeeDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getById(id: number): Promise<EmployeeDto | undefined> {
		return record('EmployeeService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getByIds(ids: number[]): Promise<EmployeeDto[]> {
		if (ids.length === 0) return []
		return record('EmployeeService.getByIds', async () => {
			const items = await this.repo.findByIds(ids)
			return items
		})
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async create(data: EmployeeCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: employeesTable,
			pkColumn: employeesTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw EmployeeError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: EmployeeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw EmployeeError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: employeesTable,
			pkColumn: employeesTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw EmployeeError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw EmployeeError.notFound(id)

		const result = await this.repo.update(id, {
			deletedAt: new Date(),
			deletedBy: actorId,
		})
		if (!result) throw EmployeeError.notFound(id)

		await this.invalidate(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: EmployeeFilterDto): Promise<WithPaginationResult<EmployeeDto>> {
		return record('EmployeeService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<EmployeeDto> {
		return record('EmployeeService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw EmployeeError.notFound(id)
			return result
		})
	}

	async handleCreate(data: EmployeeCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('EmployeeService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: EmployeeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('EmployeeService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('EmployeeService.handleRemove', async () => this.remove(id, actorId))
	}
}

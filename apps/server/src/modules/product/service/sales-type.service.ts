import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type {
	SalesTypeCreateDto,
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from '../dto'
import { SalesTypeRepo } from '../repo/sales-type.repo'

export class SalesTypeService {
	constructor(private readonly repo = new SalesTypeRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.getById', async () => {
			const type = await this.repo.getById(id)
			if (!type)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
			return type
		})
	}

	async find(): Promise<SalesTypeDto[]> {
		return record('SalesTypeService.find', async () => {
			return this.repo.getAll()
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: SalesTypeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<SalesTypeUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesTypeService.handleUpdate', async () => {
			return this.repo.update(id, data, actorId)
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleRemove', async () => {
			return this.repo.delete(id)
		})
	}

	/* --------------------------------- INTERNAL -------------------------------- */

	async seed(data: (SalesTypeCreateDto & { id?: number; createdBy: number })[]): Promise<void> {
		return record('SalesTypeService.seed', async () => {
			return this.repo.seed(data)
		})
	}
}

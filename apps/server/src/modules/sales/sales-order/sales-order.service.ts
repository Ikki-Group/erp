import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from './sales-order.dto'
import { SalesOrderRepo } from './sales-order.repo'

export class SalesOrderService {
	constructor(private readonly repo: SalesOrderRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.getById', async () => {
			const order = await this.repo.getById(id)
			if (!order) throw new NotFoundError(`Sales Order ${id} not found`, 'SALES_ORDER_NOT_FOUND')
			return order
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleCreate(data: SalesOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleAddBatch(
		orderId: number,
		data: SalesOrderAddBatchDto,
		actorId: number,
	): Promise<{ batchId: number }> {
		return record('SalesOrderService.handleAddBatch', async () => {
			return this.repo.addBatch(orderId, data, actorId)
		})
	}

	async handleClose(orderId: number, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleClose', async () => {
			return this.repo.close(orderId, actorId)
		})
	}

	async handleVoid(
		orderId: number,
		data: SalesOrderVoidDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderService.handleVoid', async () => {
			return this.repo.void(orderId, data, actorId)
		})
	}

	async handleExternalIngestion(
		data: SalesOrderCreateDto,
		externalRef: { source: string; extId: string; payload: any },
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderService.handleExternalIngestion', async () => {
			const existingId = await this.repo.checkExistingExternalRef(
				externalRef.source,
				externalRef.extId,
			)
			if (existingId) return { id: existingId }

			return this.repo.createWithExternalRef(data, externalRef, actorId)
		})
	}

	async handleList(filter: SalesOrderFilterDto): Promise<WithPaginationResult<SalesOrderDto>> {
		return record('SalesOrderService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.handleDetail', async () => {
			return this.getById(id)
		})
	}
}

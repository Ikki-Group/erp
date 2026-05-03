import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

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
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesOrderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'sales.order', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.getById', async () => {
			const key = `byId:${id}`
			const order = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!order) throw new NotFoundError(`Sales Order ${id} not found`, 'SALES_ORDER_NOT_FOUND')
			return order
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleCreate(data: SalesOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleAddBatch(
		orderId: number,
		data: SalesOrderAddBatchDto,
		actorId: number,
	): Promise<{ batchId: number }> {
		return record('SalesOrderService.handleAddBatch', async () => {
			const result = await this.repo.addBatch(orderId, data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${orderId}`] })
			return result
		})
	}

	async handleClose(orderId: number, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleClose', async () => {
			const result = await this.repo.close(orderId, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${orderId}`] })
			return result
		})
	}

	async handleVoid(
		orderId: number,
		data: SalesOrderVoidDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesOrderService.handleVoid', async () => {
			const result = await this.repo.void(orderId, data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${orderId}`] })
			return result
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

			const result = await this.repo.createWithExternalRef(data, externalRef, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleList(filter: SalesOrderFilterDto): Promise<WithPaginationResult<SalesOrderDto>> {
		return record('SalesOrderService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.handleDetail', async () => {
			return this.getById(id)
		})
	}
}

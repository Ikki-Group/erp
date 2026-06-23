import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import { NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from './sales-order.contract'
import { SalesOrderRepo } from './sales-order.repo'

interface SalesOrderServiceDeps {
	location: import('@/modules/location').LocationServiceModule
	crm: import('@/modules/crm').CrmServiceModule
	product: import('@/modules/product').ProductServiceModule
	salesType: import('../../sales-type').SalesTypeServiceModule
}

export class SalesOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesOrderRepo,
		cacheClient: CacheClient,
		private readonly deps: SalesOrderServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales.order')
	}

	/* --------------------------------- PRIVATE -------------------------------- */

	private async validateRelatedEntities(data: SalesOrderCreateDto) {
		// Validate location exists
		const location = await this.deps.location.location.getById(data.locationId)
		if (!location) {
			throw new NotFoundError(`Location with ID ${data.locationId} not found`, { code: 'LOCATION_NOT_FOUND' })
		}

		// Validate sales type exists
		const salesType = await this.deps.salesType.salesType.getById(data.salesTypeId)
		if (!salesType) {
			throw new NotFoundError(
				`Sales type with ID ${data.salesTypeId} not found`,
				{ code: 'SALES_TYPE_NOT_FOUND' }
			)
		}

		// Validate customer exists if provided
		if (data.customerId) {
			const customer = await this.deps.crm.customer.getById(data.customerId)
			if (!customer) {
				throw new NotFoundError(
					`Customer with ID ${data.customerId} not found`,
					{ code: 'CUSTOMER_NOT_FOUND' }
				)
			}
		}

		// Validate products exist if provided
		if (data.items) {
			for (const item of data.items) {
				if (item.productId) {
					const product = await this.deps.product.product.getById(item.productId)
					if (!product) {
						throw new NotFoundError(
							`Product with ID ${item.productId} not found`,
							{ code: 'PRODUCT_NOT_FOUND' }
						)
					}
				}
			}
		}
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.getById', async () => {
			const key = `byId:${id}`
			const order = await this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!order) throw new NotFoundError(`Sales Order ${id} not found`, { code: 'SALES_ORDER_NOT_FOUND' })
			return order
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleCreate(data: SalesOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesOrderService.handleCreate', async () => {
			// Validate related entities before creating
			await this.validateRelatedEntities(data)

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

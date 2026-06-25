import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { RecordId } from '@/shared/schema'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import * as dto from './sales-invoice.contract'
import { SalesInvoiceRepo } from './sales-invoice.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Sales invoice with ID ${id} not found`, { code: 'SALES_INVOICE_NOT_FOUND' }),
	orderNotFound: (id: number) =>
		new NotFoundError(`Sales order with ID ${id} not found`, { code: 'SALES_ORDER_NOT_FOUND' }),
	createFailed: () =>
		new InternalServerError('Sales invoice creation failed', { code: 'SALES_INVOICE_CREATE_FAILED' }),
}

export class SalesInvoiceService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesInvoiceRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales.invoice')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.SalesInvoiceDto | undefined> {
		return record('SalesInvoiceService.getById', async () => {
			const key = `byId:${id}`
			return this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async getWithItems(id: number): Promise<dto.SalesInvoiceWithItemsDto | undefined> {
		return record('SalesInvoiceService.getWithItems', async () => {
			const key = `withItems:${id}`
			return this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getWithItems(id),
			})
		})
	}

	async getByOrderId(orderId: number): Promise<dto.SalesInvoiceDto | undefined> {
		return record('SalesInvoiceService.getByOrderId', async () => {
			const key = `byOrderId:${orderId}`
			return this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getByOrderId(orderId),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.SalesInvoiceFilterDto,
	): Promise<WithPaginationResult<dto.SalesInvoiceDto>> {
		return record('SalesInvoiceService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<dto.SalesInvoiceDto> {
		return record('SalesInvoiceService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleDetailWithItems(id: number): Promise<dto.SalesInvoiceWithItemsDto> {
		return record('SalesInvoiceService.handleDetailWithItems', async () => {
			const result = await this.repo.getWithItems(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.SalesInvoiceCreateDto, actorId: number): Promise<RecordId> {
		return record('SalesInvoiceService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return { id: result }
		})
	}

	async handleGenerateFromOrder(
		data: dto.SalesInvoiceGenerateDto,
		actorId: number,
	): Promise<RecordId> {
		return record('SalesInvoiceService.handleGenerateFromOrder', async () => {
			// Check if invoice already exists for this order
			const existing = await this.repo.getByOrderId(data.orderId)
			if (existing) {
				throw new InternalServerError(
					'Invoice already exists for this order',
					{ code: 'INVOICE_ALREADY_EXISTS' }
				)
			}

			const result = await this.repo.generateFromOrder(data.orderId, data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: ['list', 'count', `byOrderId:${data.orderId}`] })
			return { id: result }
		})
	}

	async handleUpdate(data: dto.SalesInvoiceUpdateDto, actorId: number): Promise<RecordId> {
		return record('SalesInvoiceService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			// Prevent updating status from paid/void
			if (existing.status === 'paid' || existing.status === 'void') {
				throw new InternalServerError(
					'Cannot update a paid or voided invoice',
					{ code: 'CANNOT_UPDATE_PAID_OR_VOIDED_INVOICE' }
				)
			}

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`, `withItems:${id}`] })
			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('SalesInvoiceService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			// Prevent deleting paid or open invoices
			if (existing.status === 'paid' || existing.status === 'open') {
				throw new InternalServerError(
					'Cannot delete a paid or open invoice',
					{ code: 'CANNOT_DELETE_PAID_OR_OPEN_INVOICE' }
				)
			}

			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`, `withItems:${id}`] })
			return { id }
		})
	}
}

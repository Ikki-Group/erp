import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { CacheService, type CacheClient } from '@/lib/cache'

import * as dto from './purchase-order.dto'
import { PurchaseOrderRepo } from './purchase-order.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Purchase Order with ID ${id} not found`, 'PURCHASE_ORDER_NOT_FOUND'),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(
			`Cannot approve/reject PO with status ${currentStatus}`,
			'INVALID_PO_STATUS',
		),
}

export class PurchaseOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: PurchaseOrderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'purchasing.order', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.PurchaseOrderDto> {
		return record('PurchaseOrderService.getById', async () => {
			const key = `byId:${id}`
			const order = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!order) throw err.notFound(id)
			return order
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.PurchaseOrderFilterDto,
	): Promise<WithPaginationResult<dto.PurchaseOrderSelectDto>> {
		return record('PurchaseOrderService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<dto.PurchaseOrderDto> {
		return record('PurchaseOrderService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.PurchaseOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(data: dto.PurchaseOrderUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleUpdate', async () => {
			const result = await this.repo.update(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
			return result
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleHardRemove', async () => {
			const result = await this.repo.hardDelete(id)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleSubmitForApproval(
		data: dto.PurchaseOrderSubmitForApprovalDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleSubmitForApproval', async () => {
			const { id } = data
			const order = await this.repo.getById(id)
			if (!order) throw err.notFound(id)

			// Can only submit for approval if status is 'open'
			if (order.status !== 'open') {
				throw err.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'pending_approval', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleApprove(data: dto.PurchaseOrderApproveDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleApprove', async () => {
			const { id } = data
			const order = await this.repo.getById(id)
			if (!order) throw err.notFound(id)

			// Can only approve if status is 'pending_approval'
			if (order.status !== 'pending_approval') {
				throw err.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'approved', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleReject(data: dto.PurchaseOrderRejectDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleReject', async () => {
			const { id } = data
			const order = await this.repo.getById(id)
			if (!order) throw err.notFound(id)

			// Can only reject if status is 'pending_approval'
			if (order.status !== 'pending_approval') {
				throw err.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'rejected', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}
}

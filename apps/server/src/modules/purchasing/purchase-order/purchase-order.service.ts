import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { RecordId } from '@/core/validation'

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
	constructor(private readonly repo: PurchaseOrderRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.PurchaseOrderDto> {
		return record('PurchaseOrderService.getById', async () => {
			const order = await this.repo.getById(id)
			if (!order) throw err.notFound(id)
			return order
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.PurchaseOrderFilterDto,
	): Promise<WithPaginationResult<dto.PurchaseOrderSelectDto>> {
		return record('PurchaseOrderService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.PurchaseOrderDto> {
		return record('PurchaseOrderService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.PurchaseOrderCreateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(data: dto.PurchaseOrderUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleUpdate', async () => {
			return this.repo.update(data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('PurchaseOrderService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
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

			return this.repo.updateStatus(id, 'pending_approval', actorId)
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

			return this.repo.updateStatus(id, 'approved', actorId)
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

			return this.repo.updateStatus(id, 'rejected', actorId)
		})
	}
}

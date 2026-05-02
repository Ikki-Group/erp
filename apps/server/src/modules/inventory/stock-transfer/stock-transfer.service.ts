import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type * as dto from './stock-transfer.dto'
import { StockTransferRepo } from './stock-transfer.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Stock transfer with ID ${id} not found`, 'STOCK_TRANSFER_NOT_FOUND'),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(
			`Cannot approve/reject/cancel transfer with status ${currentStatus}`,
			'INVALID_TRANSFER_STATUS',
		),
}

export class StockTransferService {
	constructor(private readonly repo: StockTransferRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.StockTransferDto> {
		return record('StockTransferService.getById', async () => {
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)
			return transfer
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.StockTransferFilterDto,
	): Promise<WithPaginationResult<dto.StockTransferSelectDto>> {
		return record('StockTransferService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.StockTransferDto> {
		return record('StockTransferService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.StockTransferCreateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(data: dto.StockTransferUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleUpdate', async () => {
			return this.repo.update(data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleSubmitForApproval(
		data: dto.StockTransferSubmitForApprovalDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleSubmitForApproval', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only submit for approval if status is 'pending_approval'
			if (transfer.status !== 'pending_approval') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'pending_approval', actorId)
		})
	}

	async handleApprove(
		data: dto.StockTransferApproveDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleApprove', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only approve if status is 'pending_approval'
			if (transfer.status !== 'pending_approval') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'approved', actorId)
		})
	}

	async handleReject(
		data: dto.StockTransferRejectDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleReject', async () => {
			const { id, reason } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only reject if status is 'pending_approval'
			if (transfer.status !== 'pending_approval') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateWithRejectionReason(id, 'rejected', reason, actorId)
		})
	}

	async handleMarkInTransit(
		data: dto.StockTransferMarkInTransitDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleMarkInTransit', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only mark in transit if status is 'approved'
			if (transfer.status !== 'approved') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'in_transit', actorId)
		})
	}

	async handleMarkCompleted(
		data: dto.StockTransferMarkCompletedDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleMarkCompleted', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only mark completed if status is 'in_transit'
			if (transfer.status !== 'in_transit') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateReceivedDate(id, new Date(), actorId).then(() =>
				this.repo.updateStatus(id, 'completed', actorId),
			)
		})
	}

	async handleCancel(
		data: dto.StockTransferCancelDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('StockTransferService.handleCancel', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only cancel if status is 'pending_approval' or 'approved'
			if (transfer.status !== 'pending_approval' && transfer.status !== 'approved') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'cancelled', actorId)
		})
	}
}

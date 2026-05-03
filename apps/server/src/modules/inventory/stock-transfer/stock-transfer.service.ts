import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

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
	private readonly cache: CacheService

	constructor(
		private readonly repo: StockTransferRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'inventory.stock-transfer', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.StockTransferDto> {
		return record('StockTransferService.getById', async () => {
			const key = `byId:${id}`
			const transfer = await this.cache.getOrSetSkipUndefined({
				key,
				factory: async () => this.repo.getById(id),
			})
			if (!transfer) throw err.notFound(id)
			return transfer
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.StockTransferFilterDto,
	): Promise<WithPaginationResult<dto.StockTransferSelectDto>> {
		return record('StockTransferService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<dto.StockTransferDto> {
		return record('StockTransferService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.StockTransferCreateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(data: dto.StockTransferUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleUpdate', async () => {
			const result = await this.repo.update(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
			return result
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
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

			return this.repo.updateStatus(id, 'pending_approval', actorId).then((result) => {
				void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
				return result
			})
		})
	}

	async handleApprove(data: dto.StockTransferApproveDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleApprove', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only approve if status is 'pending_approval'
			if (transfer.status !== 'pending_approval') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'approved', actorId).then((result) => {
				void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
				return result
			})
		})
	}

	async handleReject(data: dto.StockTransferRejectDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleReject', async () => {
			const { id, reason } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only reject if status is 'pending_approval'
			if (transfer.status !== 'pending_approval') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateWithRejectionReason(id, 'rejected', reason, actorId).then((result) => {
				void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
				return result
			})
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

			return this.repo.updateStatus(id, 'in_transit', actorId).then((result) => {
				void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
				return result
			})
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
				this.repo.updateStatus(id, 'completed', actorId).then((result) => {
					void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
					return result
				}),
			)
		})
	}

	async handleCancel(data: dto.StockTransferCancelDto, actorId: number): Promise<{ id: number }> {
		return record('StockTransferService.handleCancel', async () => {
			const { id } = data
			const transfer = await this.repo.getById(id)
			if (!transfer) throw err.notFound(id)

			// Can only cancel if status is 'pending_approval' or 'approved'
			if (transfer.status !== 'pending_approval' && transfer.status !== 'approved') {
				throw err.invalidStatus(transfer.status)
			}

			return this.repo.updateStatus(id, 'cancelled', actorId).then((result) => {
				void this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
				return result
			})
		})
	}
}

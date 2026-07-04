import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type * as dto from './stock-transfer.contract'
import { StockTransferError } from './stock-transfer.internal'
import type { IStockTransferRepo } from './stock-transfer.repo'

export class StockTransferService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IStockTransferRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory.stock-transfer')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async handleList(
		filter: dto.StockTransferFilterDto,
	): Promise<WithPaginationResult<dto.StockTransferSelectDto>> {
		return record('StockTransferService.handleList', async () =>
			this.cache.getOrSet({
				key: `list.${JSON.stringify(filter)}`,
				factory: () => this.repo.findPage(filter),
			}),
		)
	}

	async handleDetail(id: number): Promise<dto.StockTransferDto> {
		return record('StockTransferService.handleDetail', async () => {
			const result = await this.repo.findById(id)
			if (!result) throw StockTransferError.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.StockTransferCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleCreate', async () => {
			const meta = stampCreate(actorId)
			const { items, ...transferData } = data

			const itemValues = items.map((item) => ({
				materialId: item.materialId,
				itemName: item.itemName,
				quantity: item.quantity?.toString(),
				unitCost: item.unitCost?.toString(),
				totalCost: item.totalCost?.toString(),
				notes: item.notes,
				...meta,
			}))

			const result = await withTransaction(this.repo.db, async (tx) => {
				const created = await this.repo.insert(
					{ ...transferData, ...meta },
					itemValues,
					tx,
				)
				if (!created) throw StockTransferError.createFailed()
				return created
			})

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: dto.StockTransferUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleUpdate', async () => {
			const { id, items, ...transferData } = data
			const updateMeta = stampUpdate(actorId)
			const createMeta = stampCreate(actorId)

			const existing = await this.repo.findById(id)
			if (!existing) throw StockTransferError.notFound(id)

			const itemValues = items?.map((item) => ({
				materialId: item.materialId,
				itemName: item.itemName,
				quantity: item.quantity?.toString(),
				unitCost: item.unitCost?.toString(),
				totalCost: item.totalCost?.toString(),
				notes: item.notes,
				...createMeta,
			}))

			const result = await withTransaction(this.repo.db, async (tx) => {
				const updated = await this.repo.update(id, { ...transferData, ...updateMeta }, itemValues, tx)
				if (!updated) throw StockTransferError.notFound(id)
				return updated
			})

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleSubmitForApproval(data: dto.StockTransferSubmitForApprovalDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleSubmitForApproval', async () => {
			const { id } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'pending_approval') {
				throw StockTransferError.invalidStatus(transfer.status, 'submit for approval')
			}

			const result = await this.repo.updateStatus(id, 'pending_approval', actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleApprove(data: dto.StockTransferApproveDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleApprove', async () => {
			const { id } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'pending_approval') {
				throw StockTransferError.invalidStatus(transfer.status, 'approve')
			}

			const result = await this.repo.updateStatus(id, 'approved', actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleReject(data: dto.StockTransferRejectDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleReject', async () => {
			const { id, reason } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'pending_approval') {
				throw StockTransferError.invalidStatus(transfer.status, 'reject')
			}

			const result = await this.repo.updateStatusWithReason(id, 'rejected', reason, actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleMarkInTransit(data: dto.StockTransferMarkInTransitDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleMarkInTransit', async () => {
			const { id } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'approved') {
				throw StockTransferError.invalidStatus(transfer.status, 'mark in transit')
			}

			const result = await this.repo.updateStatus(id, 'in_transit', actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleMarkCompleted(data: dto.StockTransferMarkCompletedDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleMarkCompleted', async () => {
			const { id } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'in_transit') {
				throw StockTransferError.invalidStatus(transfer.status, 'mark completed')
			}

			const result = await withTransaction(this.repo.db, async (tx) => {
				await this.repo.updateReceivedDate(id, new Date(), actorId, tx)
				const updated = await this.repo.updateStatus(id, 'completed', actorId, tx)
				if (!updated) throw StockTransferError.notFound(id)
				return updated
			})

			await this.invalidate(id)
			return result
		})
	}

	async handleCancel(data: dto.StockTransferCancelDto, actorId: ActorId): Promise<EntityRef> {
		return record('StockTransferService.handleCancel', async () => {
			const { id } = data
			const transfer = await this.repo.findById(id)
			if (!transfer) throw StockTransferError.notFound(id)

			if (transfer.status !== 'pending_approval' && transfer.status !== 'approved') {
				throw StockTransferError.invalidStatus(transfer.status, 'cancel')
			}

			const result = await this.repo.updateStatus(id, 'cancelled', actorId)
			if (!result) throw StockTransferError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}

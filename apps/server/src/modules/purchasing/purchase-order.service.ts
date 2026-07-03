import { CacheService, type CacheClient } from '@/infra/cache'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderSelectDto,
	PurchaseOrderCreateDto,
	PurchaseOrderUpdateDto,
	PurchaseOrderSubmitForApprovalDto,
	PurchaseOrderApproveDto,
	PurchaseOrderRejectDto,
} from './purchase-order.contract'
import { PurchaseOrderRepo } from './purchase-order.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Purchase Order with ID ${id} not found`, {
			code: 'PURCHASE_ORDER_NOT_FOUND',
		}),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(`Cannot approve/reject PO with status ${currentStatus}`, {
			code: 'INVALID_PO_STATUS',
		}),
}

export class PurchaseOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: PurchaseOrderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'purchasing.order')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<PurchaseOrderDto> {
		const key = `byId:${id}`
		const order = await this.cache.getOrSetWithSkip({
			key,
			factory: () => this.repo.getById(id),
		})
		if (!order) throw err.notFound(id)
		return order
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: PurchaseOrderFilterDto,
	): Promise<WithPaginationResult<PurchaseOrderSelectDto>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<PurchaseOrderDto> {
		return this.getById(id)
	}

	async handleCreate(data: PurchaseOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleUpdate(data: PurchaseOrderUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.update(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
		return result
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.softDelete(id, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.hardDelete(id)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleSubmitForApproval(
		data: PurchaseOrderSubmitForApprovalDto,
		actorId: ActorId,
	): Promise<EntityRef> {
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
	}

	async handleApprove(data: PurchaseOrderApproveDto, actorId: ActorId): Promise<EntityRef> {
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
	}

	async handleReject(data: PurchaseOrderRejectDto, actorId: ActorId): Promise<EntityRef> {
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
	}
}

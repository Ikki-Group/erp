import { CacheService, type CacheClient } from '@/infra/cache'

import type { WithPaginationResult } from '@/shared/types/pagination'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/shared/types/utils'

import { PurchaseOrderRepo } from './purchase-order.repo'
import type {
	PurchaseOrderSchema,
	PurchaseOrderFilterSchema,
	PurchaseOrderSelectSchema,
	PurchaseOrderCreateSchema,
	PurchaseOrderUpdateSchema,
	PurchaseOrderSubmitForApprovalSchema,
	PurchaseOrderApproveSchema,
	PurchaseOrderRejectSchema,
} from './purchase-order.schema'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Purchase Order with ID ${id} not found`, { code: 'PURCHASE_ORDER_NOT_FOUND' }),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(
			`Cannot approve/reject PO with status ${currentStatus}`,
			{ code: 'INVALID_PO_STATUS' }),
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

	async getById(id: number): Promise<PurchaseOrderSchema> {
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
		filter: PurchaseOrderFilterSchema,
	): Promise<WithPaginationResult<PurchaseOrderSelectSchema>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<PurchaseOrderSchema> {
		return this.getById(id)
	}

	async handleCreate(data: PurchaseOrderCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleUpdate(data: PurchaseOrderUpdateSchema, actorId: ActorId): Promise<EntityRef> {
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
		data: PurchaseOrderSubmitForApprovalSchema,
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

	async handleApprove(data: PurchaseOrderApproveSchema, actorId: ActorId): Promise<EntityRef> {
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

	async handleReject(data: PurchaseOrderRejectSchema, actorId: ActorId): Promise<EntityRef> {
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

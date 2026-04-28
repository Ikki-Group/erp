import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type * as dto from './purchase-order.dto'
import { PurchaseOrderRepo } from './purchase-order.repo'

export class PurchaseOrderService {
	constructor(private readonly repo: PurchaseOrderRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.PurchaseOrderDto> {
		return record('PurchaseOrderService.getById', async () => {
			const order = await this.repo.getById(id)
			if (!order)
				throw new NotFoundError(
					`Purchase Order with ID ${id} not found`,
					'PURCHASE_ORDER_NOT_FOUND',
				)
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
}

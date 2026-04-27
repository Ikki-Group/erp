import { record } from '@elysiajs/opentelemetry'
import Decimal from 'decimal.js'

import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'

import type { InventoryServiceModule } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe/service/recipe.service'

import type {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
} from '../dto/work-order.dto'
import { WorkOrderRepo } from '../repo/work-order.repo'

export class WorkOrderService {
	constructor(
		private readonly recipeSvc: RecipeService,
		private readonly inventorySvc: InventoryServiceModule,
		private readonly repo = new WorkOrderRepo(),
	) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.getById', async () => {
			const wo = await this.repo.getById(id)
			if (!wo) throw new NotFoundError(`Work Order with ID ${id} not found`, 'WORK_ORDER_NOT_FOUND')
			return wo
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		return record('WorkOrderService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: WorkOrderCreateDto, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleStart(id: number, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleStart', async () => {
			const wo = await this.getById(id)
			if (wo.status !== 'draft') throw new ConflictError(`Only draft Work Orders can be started`)

			return this.repo.update(id, { status: 'in_progress', startedAt: new Date() }, actorId)
		})
	}

	async handleComplete(
		id: number,
		data: WorkOrderCompleteDto,
		actorId: number,
	): Promise<WorkOrderDto> {
		return record('WorkOrderService.handleComplete', async () => {
			const wo = await this.getById(id)
			if (wo.status !== 'in_progress')
				throw new ConflictError(
					`Work Order with ID ${id} is not in progress`,
					'WORK_ORDER_STATUS_CONFLICT',
				)

			const recipe = await this.recipeSvc.getById(wo.recipeId)
			const actualQty = new Decimal(data.actualQty)
			const targetQty = new Decimal(recipe.targetQty)
			const multiplier = actualQty.div(targetQty.isPositive() ? targetQty : 1)

			const costRes = await this.recipeSvc.handleCalculateCost(wo.recipeId)
			const actualTotalCost = new Decimal(costRes.totalCost).mul(multiplier)

			return db.transaction(async (tx) => {
				// 1. Consume raw materials
				if (recipe.items) {
					await this.inventorySvc.transaction.handleProductionOut(
						{
							locationId: wo.locationId,
							date: new Date(),
							referenceNo: `WO-OUT-${wo.id}`,
							notes: `Consumed for Work Order #${wo.id}`,
							items: recipe.items.map((item) => ({
								materialId: item.materialId,
								qty: new Decimal(item.qty)
									.mul(multiplier)
									.mul(new Decimal(1).plus(new Decimal(item.scrapPercentage).div(100)))
									.toString(),
							})),
						},
						actorId,
						tx,
					)
				}

				// 2. Add finished good
				if (recipe.materialId) {
					await this.inventorySvc.transaction.handleProductionIn(
						{
							locationId: wo.locationId,
							date: new Date(),
							referenceNo: `WO-IN-${wo.id}`,
							notes: `Produced from Work Order #${wo.id}`,
							items: [
								{
									materialId: recipe.materialId,
									qty: actualQty.toString(),
									unitCost: actualTotalCost.div(actualQty).toString(),
								},
							],
						},
						actorId,
						tx,
					)
				}

				// 3. Finalize Work Order
				return this.repo.update(
					id,
					{
						status: 'completed',
						actualQty: actualQty.toString(),
						totalCost: actualTotalCost.toString(),
						completedAt: new Date(),
					},
					actorId,
				)
			})
		})
	}
}

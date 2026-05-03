import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, isNull } from 'drizzle-orm'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/require-await */
import {
	paginate,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'

import { workOrdersTable } from '@/db/schema/production'

import type { WorkOrderCreateDto, WorkOrderDto, WorkOrderFilterDto } from './work-order.dto'

export class WorkOrderRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<WorkOrderDto | undefined> {
		return record('WorkOrderRepo.getById', async () => {
			const [wo] = await this.db
				.select()
				.from(workOrdersTable)
				.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))

			if (!wo) return undefined
			return wo as unknown as WorkOrderDto
		})
	}

	async getListPaginated(filter: WorkOrderFilterDto): Promise<WithPaginationResult<WorkOrderDto>> {
		return record('WorkOrderRepo.getListPaginated', async () => {
			const { locationId, status, page, limit } = filter

			const where = and(
				isNull(workOrdersTable.deletedAt),
				locationId ? eq(workOrdersTable.locationId, locationId) : undefined,
				status ? eq(workOrdersTable.status, status) : undefined,
			)

			return paginate({
				data: ({ limit: l, offset }) =>
					this.db
						.select()
						.from(workOrdersTable)
						.where(where)
						.orderBy(desc(workOrdersTable.createdAt))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(workOrdersTable).where(where),
			}) as unknown as WithPaginationResult<WorkOrderDto>
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: WorkOrderCreateDto, actorId: number): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.create', async () => {
			const [result] = await this.db
				.insert(workOrdersTable)
				.values({
					...data,
					expectedQty: data.expectedQty.toString(),
					actualQty: '0',
					totalCost: '0',
					...stampCreate(actorId),
				})
				.returning()

			return result as unknown as WorkOrderDto
		})
	}

	async update(
		id: number,
		data: Partial<{
			expectedQty: string
			status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
			actualQty: string
			totalCost: string
			startedAt: Date
			completedAt: Date
			note: string | null
		}>,
		actorId: number,
	): Promise<WorkOrderDto> {
		return record('WorkOrderRepo.update', async () => {
			const [result] = await this.db
				.update(workOrdersTable)
				.set({
					...data,
					...stampUpdate(actorId),
				})
				.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))
				.returning()

			return result as unknown as WorkOrderDto
		})
	}
}

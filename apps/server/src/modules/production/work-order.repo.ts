import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { workOrdersTable } from '@/db/schema/production'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/require-await */
import {
	paginate, type DbClient} from '@/infra/database'
import type { WithPaginationResult } from '@/types/pagination'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	WorkOrderCreateSchema,
	WorkOrderSchema,
	WorkOrderFilterSchema,
} from './work-order.schema'

export class WorkOrderRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<WorkOrderSchema | undefined> {
		const [wo] = await this.db
			.select()
			.from(workOrdersTable)
			.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))

		if (!wo) return undefined
		return wo as unknown as WorkOrderSchema
	}

	async getListPaginated(
		filter: WorkOrderFilterSchema,
	): Promise<WithPaginationResult<WorkOrderSchema>> {
		const { locationId, status, page, limit } = filter

		const where = and(
			isNull(workOrdersTable.deletedAt),
			locationId ? eq(workOrdersTable.locationId, locationId) : undefined,
			status ? eq(workOrdersTable.status, status) : undefined,
		)

		return paginate<any>({
			data: ({ limit: l, offset }) =>
				this.db
					.select()
					.from(workOrdersTable)
					.where(where)
					.orderBy(desc(workOrdersTable.createdAt))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: () => this.db.select({ count: count() }).from(workOrdersTable).where(where),
		}) as unknown as WithPaginationResult<WorkOrderSchema>
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: WorkOrderCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const [result] = await this.db
			.insert(workOrdersTable)
			.values({
				...data,
				expectedQty: data.expectedQty.toString(),
				actualQty: '0',
				totalCost: '0',
				...stampCreate(actorId),
			})
			.returning({ id: workOrdersTable.id })

		if (!result) throw new Error('Create Work Order failed')
		return { id: result.id }
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
		actorId: ActorId,
	): Promise<EntityRef> {
		await this.db
			.update(workOrdersTable)
			.set({
				...data,
				...stampUpdate(actorId),
			})
			.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))

		return { id }
	}
}

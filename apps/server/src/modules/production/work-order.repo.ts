import { and, count, desc, eq, isNull } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { workOrdersTable } from '@/db/schema/production'
import { paginate, takeFirst, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { WorkOrderDto, WorkOrderFilterDto } from './work-order.contract'

type WorkOrderInsert = typeof workOrdersTable.$inferInsert
type WorkOrderUpdate = PgUpdateSetSource<typeof workOrdersTable>

export interface IWorkOrderRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<WorkOrderDto | undefined>
	findPage(filter: WorkOrderFilterDto, db?: DbContext): Promise<WithPaginationResult<WorkOrderDto>>
	insert(data: WorkOrderInsert, actorId: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	update(
		id: number,
		data: WorkOrderUpdate,
		actorId: ActorId,
		db?: DbContext,
	): Promise<EntityRef | undefined>
}

export class WorkOrderRepo implements IWorkOrderRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<WorkOrderDto | undefined> {
		return db
			.select()
			.from(workOrdersTable)
			.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))
			.limit(1)
			.then(takeFirst)
	}

	async findPage(
		filter: WorkOrderFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<WorkOrderDto>> {
		const { locationId, status, page, limit } = filter

		const where = and(
			isNull(workOrdersTable.deletedAt),
			locationId ? eq(workOrdersTable.locationId, locationId) : undefined,
			status ? eq(workOrdersTable.status, status) : undefined,
		)

		return paginate<WorkOrderDto>({
			data: ({ limit: l, offset }) =>
				db
					.select()
					.from(workOrdersTable)
					.where(where)
					.orderBy(desc(workOrdersTable.createdAt))
					.limit(l)
					.offset(offset),
			pq: { page, limit },
			countQuery: () => db.select({ count: count() }).from(workOrdersTable).where(where),
		})
	}

	async insert(
		data: WorkOrderInsert,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(workOrdersTable)
			.values({
				...data,
				expectedQty: String(data.expectedQty ?? '0'),
				actualQty: '0',
				totalCost: '0',
				...stampCreate(actorId),
			})
			.returning({ id: workOrdersTable.id })

		return result
	}

	async update(
		id: number,
		data: WorkOrderUpdate,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(workOrdersTable)
			.set({
				...data,
				...stampUpdate(actorId),
			})
			.where(and(eq(workOrdersTable.id, id), isNull(workOrdersTable.deletedAt)))
			.returning({ id: workOrdersTable.id })

		return result
	}
}

import { and, count, eq, isNull, or, type SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { purchaseOrderItemsTable, purchaseOrdersTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { PurchaseOrderDto, PurchaseOrderFilterDto, PurchaseOrderSelectDto, PurchaseOrderStatus } from './purchase-order.contract'

type PurchaseOrderInsert = typeof purchaseOrdersTable.$inferInsert
type PurchaseOrderUpdate = Omit<PgUpdateSetSource<typeof purchaseOrdersTable>, 'items'>
type PurchaseOrderItemInsert = typeof purchaseOrderItemsTable.$inferInsert

export interface IPurchaseOrderRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<PurchaseOrderDto | undefined>
	findPage(filter: PurchaseOrderFilterDto, db?: DbContext): Promise<WithPaginationResult<PurchaseOrderSelectDto>>
	insert(data: PurchaseOrderInsert, items: PurchaseOrderItemInsert[], db?: DbContext): Promise<EntityRef | undefined>
	update(
		id: number,
		data: PurchaseOrderUpdate,
		items: PurchaseOrderItemInsert[],
		db?: DbContext,
	): Promise<EntityRef | undefined>
	updateStatus(id: number, status: PurchaseOrderStatus, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class PurchaseOrderRepo implements IPurchaseOrderRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<PurchaseOrderFilterDto, 'q' | 'status' | 'locationId' | 'supplierId'>>): SQL | undefined {
		const { q, status, locationId, supplierId } = filter
		return and(
			isNull(purchaseOrdersTable.deletedAt),
			q === undefined ? undefined : or(searchFilter(purchaseOrdersTable.notes, q)),
			status === undefined ? undefined : eq(purchaseOrdersTable.status, status),
			locationId === undefined ? undefined : eq(purchaseOrdersTable.locationId, locationId),
			supplierId === undefined ? undefined : eq(purchaseOrdersTable.supplierId, supplierId),
		)
	}

	async findById(id: number, db: DbContext = this.db): Promise<PurchaseOrderDto | undefined> {
		const [order] = await db
			.select()
			.from(purchaseOrdersTable)
			.where(and(eq(purchaseOrdersTable.id, id), isNull(purchaseOrdersTable.deletedAt)))
			.limit(1)

		if (!order) return undefined

		const items = await db
			.select()
			.from(purchaseOrderItemsTable)
			.where(and(eq(purchaseOrderItemsTable.orderId, id), isNull(purchaseOrderItemsTable.deletedAt)))

		return { ...order, items }
	}

	async findPage(
		filter: PurchaseOrderFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<PurchaseOrderSelectDto>> {
		const where = this.#buildWhere(filter)

		return paginate<PurchaseOrderSelectDto>({
			data: async ({ limit, offset }) => {
				const rows = await db
					.select()
					.from(purchaseOrdersTable)
					.where(where)
					.orderBy(sortBy(purchaseOrdersTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset)
				return rows
			},
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(purchaseOrdersTable).where(where),
		})
	}

	async insert(
		data: PurchaseOrderInsert,
		items: PurchaseOrderItemInsert[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [insertedOrder] = await db
			.insert(purchaseOrdersTable)
			.values(data)
			.returning({ id: purchaseOrdersTable.id })

		if (!insertedOrder) return undefined

		if (items.length > 0) {
			await db.insert(purchaseOrderItemsTable).values(items)
		}

		return { id: insertedOrder.id }
	}

	async update(
		id: number,
		data: PurchaseOrderUpdate,
		items: PurchaseOrderItemInsert[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [updated] = await db
			.update(purchaseOrdersTable)
			.set(data)
			.where(eq(purchaseOrdersTable.id, id))
			.returning({ id: purchaseOrdersTable.id })

		if (!updated) return undefined

		await db.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.orderId, id))

		if (items.length > 0) {
			await db.insert(purchaseOrderItemsTable).values(items)
		}

		return { id: updated.id }
	}

	async updateStatus(
		id: number,
		status: PurchaseOrderStatus,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(purchaseOrdersTable)
			.set({ status })
			.where(eq(purchaseOrdersTable.id, id))
			.returning({ id: purchaseOrdersTable.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(purchaseOrdersTable)
			.set({ deletedAt: new Date() })
			.where(eq(purchaseOrdersTable.id, id))
			.returning({ id: purchaseOrdersTable.id })
		return result
	}
}

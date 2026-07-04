/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import Decimal from 'decimal.js'
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import {
	salesExternalRefsTable,
	salesOrderBatchesTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesVoidsTable,
} from '@/db/schema/sales'

import { paginate, type DbContext } from '@/infra/database'
import { stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	SalesOrderBatchDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderItemDto,
	SalesOrderOutputDto,
	SalesVoidDto,
} from './sales-order.contract'

type SalesOrderInsert = typeof salesOrdersTable.$inferInsert
type SalesOrderUpdate = PgUpdateSetSource<typeof salesOrdersTable>
type SalesOrderItemInsert = typeof salesOrderItemsTable.$inferInsert
type SalesOrderBatchInsert = typeof salesOrderBatchesTable.$inferInsert
type SalesVoidInsert = typeof salesVoidsTable.$inferInsert
type SalesExternalRefInsert = typeof salesExternalRefsTable.$inferInsert

export interface ISalesOrderRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<SalesOrderOutputDto | undefined>
	findPage(filter: SalesOrderFilterDto, db?: DbContext): Promise<WithPaginationResult<SalesOrderDto>>
	findExternalRef(source: string, extId: string, db?: DbContext): Promise<number | undefined>
	insert(data: SalesOrderInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertItems(items: SalesOrderItemInsert[], db: DbContext): Promise<void>
	insertBatch(data: SalesOrderBatchInsert, db: DbContext): Promise<EntityRef | undefined>
	insertVoid(data: SalesVoidInsert, db: DbContext): Promise<EntityRef | undefined>
	insertExternalRef(data: SalesExternalRefInsert, db: DbContext): Promise<void>
	updateOrder(id: number, data: SalesOrderUpdate, db?: DbContext): Promise<EntityRef | undefined>
	updateOrderStatus(id: number, status: 'open' | 'closed' | 'void', actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	recalculateTotals(orderId: number, actorId: number, db: DbContext): Promise<void>
}

export class SalesOrderRepo implements ISalesOrderRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<SalesOrderFilterDto, 'locationId' | 'status' | 'salesTypeId' | 'startDate' | 'endDate'>>): SQL | undefined {
		const { locationId, status, salesTypeId, startDate, endDate } = filter

		const dateCondition =
			startDate && endDate
				? and(gte(salesOrdersTable.transactionDate, startDate), lte(salesOrdersTable.transactionDate, endDate))
				: startDate
					? gte(salesOrdersTable.transactionDate, startDate)
					: endDate
						? lte(salesOrdersTable.transactionDate, endDate)
						: undefined

		return and(
			locationId === undefined ? undefined : eq(salesOrdersTable.locationId, locationId),
			status === undefined ? undefined : eq(salesOrdersTable.status, status),
			salesTypeId === undefined ? undefined : eq(salesOrdersTable.salesTypeId, salesTypeId),
			dateCondition,
		)
	}

	async findById(id: number, db: DbContext = this.db): Promise<SalesOrderOutputDto | undefined> {
		const [row] = await db.select().from(salesOrdersTable).where(eq(salesOrdersTable.id, id))
		if (!row) return undefined

		const [items, batches, voids] = await Promise.all([
			db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, id)),
			db.select().from(salesOrderBatchesTable).where(eq(salesOrderBatchesTable.orderId, id)),
			db.select().from(salesVoidsTable).where(eq(salesVoidsTable.orderId, id)),
		])

		return {
			...row,
			items: items as unknown as SalesOrderItemDto[],
			batches: batches as unknown as SalesOrderBatchDto[],
			voids: voids as unknown as SalesVoidDto[],
		} as unknown as SalesOrderOutputDto
	}

	async findPage(filter: SalesOrderFilterDto, db: DbContext = this.db): Promise<WithPaginationResult<SalesOrderDto>> {
		const where = this.#buildWhere(filter)

		const result = await paginate({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(salesOrdersTable)
					.where(where)
					.orderBy(desc(salesOrdersTable.transactionDate))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(salesOrdersTable).where(where),
		})

		return {
			...result,
			data: result.data as unknown as SalesOrderDto[],
		}
	}

	async findExternalRef(source: string, extId: string, db: DbContext = this.db): Promise<number | undefined> {
		const [existingRef] = await db
			.select({ orderId: salesExternalRefsTable.orderId })
			.from(salesExternalRefsTable)
			.where(
				and(
					eq(salesExternalRefsTable.externalSource, source),
					eq(salesExternalRefsTable.externalOrderId, extId.toString()),
				),
			)
			.limit(1)

		return existingRef?.orderId
	}

	async insert(data: SalesOrderInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(salesOrdersTable).values(data).returning({ id: salesOrdersTable.id })
		return res
	}

	async insertItems(items: SalesOrderItemInsert[], db: DbContext): Promise<void> {
		if (items.length === 0) return
		await db.insert(salesOrderItemsTable).values(items)
	}

	async insertBatch(data: SalesOrderBatchInsert, db: DbContext): Promise<EntityRef | undefined> {
		const [res] = await db.insert(salesOrderBatchesTable).values(data).returning({ id: salesOrderBatchesTable.id })
		return res
	}

	async insertVoid(data: SalesVoidInsert, db: DbContext): Promise<EntityRef | undefined> {
		const [res] = await db.insert(salesVoidsTable).values(data).returning({ id: salesVoidsTable.id })
		return res
	}

	async insertExternalRef(data: SalesExternalRefInsert, db: DbContext): Promise<void> {
		await db.insert(salesExternalRefsTable).values(data)
	}

	async updateOrder(id: number, data: SalesOrderUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(salesOrdersTable)
			.set(data)
			.where(eq(salesOrdersTable.id, id))
			.returning({ id: salesOrdersTable.id })
		return res
	}

	async updateOrderStatus(id: number, status: 'open' | 'closed' | 'void', actorId: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(salesOrdersTable)
			.set({ status, ...stampUpdate(actorId) })
			.where(eq(salesOrdersTable.id, id))
			.returning({ id: salesOrdersTable.id })
		return res
	}

	async recalculateTotals(orderId: number, actorId: number, db: DbContext): Promise<void> {
		const allItems = await db
			.select()
			.from(salesOrderItemsTable)
			.where(eq(salesOrderItemsTable.orderId, orderId))

		const allVoids = await db
			.select()
			.from(salesVoidsTable)
			.where(eq(salesVoidsTable.orderId, orderId))

		const voidedItemIds = new Set<number>(
			allVoids
				.filter((v) => v.itemId !== null)
				.map((v) => v.itemId as number),
		)

		let totalAmount = new Decimal(0)
		let discountAmount = new Decimal(0)
		let taxAmount = new Decimal(0)

		for (const item of allItems) {
			if (!voidedItemIds.has(item.id)) {
				totalAmount = totalAmount.plus(item.subtotal)
				discountAmount = discountAmount.plus(item.discountAmount)
				taxAmount = taxAmount.plus(item.taxAmount)
			}
		}

		const metadata = stampUpdate(actorId)
		await db
			.update(salesOrdersTable)
			.set({
				totalAmount: totalAmount.toString(),
				discountAmount: discountAmount.toString(),
				taxAmount: taxAmount.toString(),
				gratuityAmount: '0',
				refundAmount: '0',
				...metadata,
			})
			.where(eq(salesOrdersTable.id, orderId))
	}
}

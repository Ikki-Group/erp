import { orderLines, orders, payments } from '@/db/schema/pos.ts'

import {
	allOf,
	eq,
	eqIf,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	OrderDetailDto,
	OrderDto,
	OrderFilterDto,
	OrderLineDto,
	OrderPaymentRecordDto,
} from './order.contract.ts'

// ─── Types ───

type OrderInsert = typeof orders.$inferInsert
type OrderUpdate = Partial<Omit<OrderInsert, 'id'>>
type OrderRow = typeof orders.$inferSelect

type OrderLineInsert = typeof orderLines.$inferInsert
type OrderLineRow = typeof orderLines.$inferSelect

type PaymentInsert = typeof payments.$inferInsert
type PaymentRow = typeof payments.$inferSelect

// ─── Mappers ───

function toOrderDto(row: OrderRow): OrderDto {
	return {
		id: row.id,
		orderNo: row.orderNo,
		locationId: row.locationId,
		tableId: row.tableId,
		shiftId: row.shiftId,
		type: row.type,
		billingMode: row.billingMode,
		status: row.status,
		subtotal: row.subtotal,
		discountAmount: row.discountAmount,
		taxAmount: row.taxAmount,
		total: row.total,
		voucherId: row.voucherId,
		voucherCode: row.voucherCode,
		customerId: row.customerId,
		source: row.source,
		externalRef: row.externalRef,
		notes: row.notes,
		orderedAt: row.orderedAt,
		completedAt: row.completedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toLineDto(row: OrderLineRow): OrderLineDto {
	return {
		id: row.id,
		orderId: row.orderId,
		menuItemId: row.menuItemId,
		menuItemName: row.menuItemName,
		quantity: row.quantity,
		unitPrice: row.unitPrice,
		modifiers: row.modifiers,
		modifierTotal: row.modifierTotal,
		discountAmount: row.discountAmount,
		lineTotal: row.lineTotal,
		status: row.status,
		notes: row.notes,
	}
}

function toPaymentDto(row: PaymentRow): OrderPaymentRecordDto {
	return {
		id: row.id,
		orderId: row.orderId,
		paymentMethodId: row.paymentMethodId,
		amount: row.amount,
		reference: row.reference,
		createdAt: row.createdAt,
	}
}

// ─── Interface ───

export interface IOrderRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<OrderDto | undefined>
	findDetailById(id: number, db?: DbContext): Promise<OrderDetailDto | undefined>
	findPage(filter: OrderFilterDto, db?: DbContext): Promise<WithPaginationResult<OrderDto>>
	insert(data: OrderInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: OrderUpdate, db?: DbContext): Promise<EntityRef | undefined>
	// Lines
	findLinesByOrderId(orderId: number, db?: DbContext): Promise<OrderLineDto[]>
	deleteLinesByOrderId(orderId: number, db?: DbContext): Promise<void>
	insertLines(lines: OrderLineInsert[], db?: DbContext): Promise<void>
	// Payments
	findPaymentsByOrderId(orderId: number, db?: DbContext): Promise<OrderPaymentRecordDto[]>
	insertPayment(data: PaymentInsert, db?: DbContext): Promise<EntityRef | undefined>
	sumPaymentsByOrderId(orderId: number, db?: DbContext): Promise<number>
}

// ─── Implementation ───

export class OrderRepo implements IOrderRepo {
	constructor(readonly db: DbContext) {}

	// ─── Order ───

	async findById(id: number, db: DbContext = this.db): Promise<OrderDto | undefined> {
		const row = await db.select().from(orders).where(eq(orders.id, id)).limit(1).then(takeFirst)
		return row ? toOrderDto(row) : undefined
	}

	async findDetailById(id: number, db: DbContext = this.db): Promise<OrderDetailDto | undefined> {
		const order = await this.findById(id, db)
		if (!order) return undefined

		const lines = await this.findLinesByOrderId(id, db)
		const paymentRecords = await this.findPaymentsByOrderId(id, db)

		return { ...order, lines, payments: paymentRecords }
	}

	async findPage(
		filter: OrderFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<OrderDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: orders.id,
				orderNo: orders.orderNo,
				locationId: orders.locationId,
				tableId: orders.tableId,
				shiftId: orders.shiftId,
				type: orders.type,
				billingMode: orders.billingMode,
				status: orders.status,
				subtotal: orders.subtotal,
				discountAmount: orders.discountAmount,
				taxAmount: orders.taxAmount,
				total: orders.total,
				voucherId: orders.voucherId,
				voucherCode: orders.voucherCode,
				customerId: orders.customerId,
				source: orders.source,
				externalRef: orders.externalRef,
				notes: orders.notes,
				orderedAt: orders.orderedAt,
				completedAt: orders.completedAt,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
				createdBy: orders.createdBy,
				updatedBy: orders.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(orders)
			.where(where)
			.orderBy(sql`${orders.orderedAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toOrderDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: OrderInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(orders).values(data).returning({ id: orders.id })
		return result
	}

	async update(
		id: number,
		data: OrderUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(orders)
			.set(data)
			.where(eq(orders.id, id))
			.returning({ id: orders.id })
		return result
	}

	// ─── Lines ───

	async findLinesByOrderId(orderId: number, db: DbContext = this.db): Promise<OrderLineDto[]> {
		const rows = await db
			.select()
			.from(orderLines)
			.where(eq(orderLines.orderId, orderId))
			.orderBy(sql`${orderLines.id} asc`)
		return rows.map(toLineDto)
	}

	async deleteLinesByOrderId(orderId: number, db: DbContext = this.db): Promise<void> {
		await db.delete(orderLines).where(eq(orderLines.orderId, orderId))
	}

	async insertLines(lines: OrderLineInsert[], db: DbContext = this.db): Promise<void> {
		if (lines.length === 0) return
		await db.insert(orderLines).values(lines)
	}

	// ─── Payments ───

	async findPaymentsByOrderId(
		orderId: number,
		db: DbContext = this.db,
	): Promise<OrderPaymentRecordDto[]> {
		const rows = await db
			.select()
			.from(payments)
			.where(eq(payments.orderId, orderId))
			.orderBy(sql`${payments.createdAt} asc`)
		return rows.map(toPaymentDto)
	}

	async insertPayment(
		data: PaymentInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db.insert(payments).values(data).returning({ id: payments.id })
		return result
	}

	async sumPaymentsByOrderId(orderId: number, db: DbContext = this.db): Promise<number> {
		const [result] = await db
			.select({
				total: sql<string>`coalesce(sum(${payments.amount}), '0')`,
			})
			.from(payments)
			.where(eq(payments.orderId, orderId))

		return Number(result?.total ?? '0')
	}

	// ─── Private ───

	#buildWhere(filter: OrderFilterDto) {
		return allOf(
			eq(orders.locationId, filter.locationId),
			eqIf(orders.status, filter.status),
			eqIf(orders.shiftId, filter.shiftId),
			searchAcross(filter.q, [orders.orderNo]),
		)
	}
}

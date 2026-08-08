import { cashierShifts, orders, payments, paymentMethods } from '@/db/schema/pos.ts'

import {
	allOf,
	eq,
	eqIf,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
	and,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { ShiftDetailDto, ShiftDto, ShiftFilterDto } from './shift.contract.ts'

// ─── Types ───

type ShiftInsert = typeof cashierShifts.$inferInsert
type ShiftUpdate = Partial<Omit<ShiftInsert, 'id'>>
type ShiftRow = typeof cashierShifts.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: ShiftRow): ShiftDto {
	return {
		id: row.id,
		locationId: row.locationId,
		userId: row.userId,
		status: row.status,
		openedAt: row.openedAt,
		closedAt: row.closedAt,
		openingCash: row.openingCash,
		closingCash: row.closingCash,
		expectedCash: row.expectedCash,
		notes: row.notes,
	}
}

// ─── Interface ───

export interface IShiftRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<ShiftDto | undefined>
	findActive(userId: number, locationId: number, db?: DbContext): Promise<ShiftDto | undefined>
	findPage(filter: ShiftFilterDto, db?: DbContext): Promise<WithPaginationResult<ShiftDto>>
	findDetail(id: number, db?: DbContext): Promise<ShiftDetailDto | undefined>
	sumCashPayments(shiftId: number, db?: DbContext): Promise<number>
	insert(data: ShiftInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: ShiftUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class ShiftRepo implements IShiftRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<ShiftDto | undefined> {
		const row = await db
			.select()
			.from(cashierShifts)
			.where(eq(cashierShifts.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findActive(
		userId: number,
		locationId: number,
		db: DbContext = this.db,
	): Promise<ShiftDto | undefined> {
		const row = await db
			.select()
			.from(cashierShifts)
			.where(
				and(
					eq(cashierShifts.userId, userId),
					eq(cashierShifts.locationId, locationId),
					eq(cashierShifts.status, 'open'),
				),
			)
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(
		filter: ShiftFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ShiftDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: cashierShifts.id,
				locationId: cashierShifts.locationId,
				userId: cashierShifts.userId,
				status: cashierShifts.status,
				openedAt: cashierShifts.openedAt,
				closedAt: cashierShifts.closedAt,
				openingCash: cashierShifts.openingCash,
				closingCash: cashierShifts.closingCash,
				expectedCash: cashierShifts.expectedCash,
				notes: cashierShifts.notes,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(cashierShifts)
			.where(where)
			.orderBy(sql`${cashierShifts.openedAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findDetail(id: number, db: DbContext = this.db): Promise<ShiftDetailDto | undefined> {
		const shift = await this.findById(id, db)
		if (!shift) return undefined

		// Get order count and total revenue for this shift
		const [stats] = await db
			.select({
				orderCount: sql<number>`count(*)::int`,
				totalRevenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
			})
			.from(orders)
			.where(eq(orders.shiftId, id))

		return {
			...shift,
			orderCount: stats?.orderCount ?? 0,
			totalRevenue: stats?.totalRevenue ?? '0',
		}
	}

	async sumCashPayments(shiftId: number, db: DbContext = this.db): Promise<number> {
		const [result] = await db
			.select({
				total: sql<string>`coalesce(sum(${payments.amount}), '0')`,
			})
			.from(payments)
			.innerJoin(orders, eq(payments.orderId, orders.id))
			.innerJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
			.where(and(eq(orders.shiftId, shiftId), eq(paymentMethods.type, 'cash')))

		return Number(result?.total ?? '0')
	}

	async insert(data: ShiftInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(cashierShifts).values(data).returning({ id: cashierShifts.id })
		return result
	}

	async update(
		id: number,
		data: ShiftUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(cashierShifts)
			.set(data)
			.where(eq(cashierShifts.id, id))
			.returning({ id: cashierShifts.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: ShiftFilterDto) {
		return allOf(
			eq(cashierShifts.locationId, filter.locationId),
			eqIf(cashierShifts.status, filter.status),
		)
	}
}

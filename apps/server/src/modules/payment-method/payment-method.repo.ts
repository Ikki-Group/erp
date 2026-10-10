import { paymentMethods, paymentMethodLocations } from '@/db/schema/pos.ts'

import {
	allOf,
	and,
	eq,
	eqIf,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { PaymentMethodDto, PaymentMethodFilterDto } from '@ikki/contract/payment-method'

// ─── Types ───

type PaymentMethodInsert = typeof paymentMethods.$inferInsert
type PaymentMethodUpdate = Partial<Omit<PaymentMethodInsert, 'id'>>
type PaymentMethodRow = typeof paymentMethods.$inferSelect

type PaymentMethodLocationInsert = typeof paymentMethodLocations.$inferInsert

/** Maps a raw DB row to the DTO shape. */
function toDto(row: PaymentMethodRow): PaymentMethodDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Implementation ───

export class PaymentMethodRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: Db = this.db): Promise<PaymentMethodDto | undefined> {
		const row = await db
			.select()
			.from(paymentMethods)
			.where(eq(paymentMethods.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(
		filter: PaymentMethodFilterDto,
		db: Db = this.db,
	): Promise<WithPaginationResult<PaymentMethodDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: paymentMethods.id,
				code: paymentMethods.code,
				name: paymentMethods.name,
				type: paymentMethods.type,
				isActive: paymentMethods.isActive,
				createdAt: paymentMethods.createdAt,
				updatedAt: paymentMethods.updatedAt,
				createdBy: paymentMethods.createdBy,
				updatedBy: paymentMethods.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(paymentMethods)
			.where(where)
			.orderBy(sql`${paymentMethods.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: PaymentMethodInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(paymentMethods)
			.values(data)
			.returning({ id: paymentMethods.id })
		return result
	}

	async update(
		id: number,
		data: PaymentMethodUpdate,
		db: Db = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(paymentMethods)
			.set(data)
			.where(eq(paymentMethods.id, id))
			.returning({ id: paymentMethods.id })
		return result
	}

	async remove(
		id: number,
		data: PaymentMethodUpdate,
		db: Db = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(paymentMethods)
			.set({ ...data, isActive: false })
			.where(eq(paymentMethods.id, id))
			.returning({ id: paymentMethods.id })
		return result
	}

	// ─── Location Assignment ───

	async findByLocation(locationId: number, db: Db = this.db): Promise<PaymentMethodDto[]> {
		const rows = await db
			.select({
				id: paymentMethods.id,
				code: paymentMethods.code,
				name: paymentMethods.name,
				type: paymentMethods.type,
				isActive: paymentMethods.isActive,
				createdAt: paymentMethods.createdAt,
				updatedAt: paymentMethods.updatedAt,
				createdBy: paymentMethods.createdBy,
				updatedBy: paymentMethods.updatedBy,
			})
			.from(paymentMethods)
			.innerJoin(
				paymentMethodLocations,
				eq(paymentMethods.id, paymentMethodLocations.paymentMethodId),
			)
			.where(
				and(
					eq(paymentMethodLocations.locationId, locationId),
					eq(paymentMethodLocations.isEnabled, true),
					eq(paymentMethods.isActive, true),
				),
			)
			.orderBy(sql`${paymentMethods.name} asc`)

		return rows.map(toDto)
	}

	async upsertLocationAssignment(
		data: PaymentMethodLocationInsert,
		db: Db = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(paymentMethodLocations)
			.values(data)
			.onConflictDoUpdate({
				target: [paymentMethodLocations.paymentMethodId, paymentMethodLocations.locationId],
				set: { isEnabled: data.isEnabled },
			})
			.returning({ id: paymentMethodLocations.id })
		return result
	}

	async removeLocationAssignment(
		paymentMethodId: number,
		locationId: number,
		db: Db = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(paymentMethodLocations)
			.where(
				and(
					eq(paymentMethodLocations.paymentMethodId, paymentMethodId),
					eq(paymentMethodLocations.locationId, locationId),
				),
			)
			.returning({ id: paymentMethodLocations.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: PaymentMethodFilterDto) {
		return allOf(
			searchAcross(filter.q, [paymentMethods.code, paymentMethods.name]),
			eqIf(paymentMethods.type, filter.type),
		)
	}
}

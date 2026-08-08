import { paymentMethods, paymentMethodLocations } from '@/db/schema/pos.ts'

import {
	allOf,
	and,
	eq,
	eqIf,
	inArray,
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
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationDto,
} from './payment-method.contract.ts'

// ─── Types ───

type PaymentMethodInsert = typeof paymentMethods.$inferInsert
type PaymentMethodUpdate = Partial<Omit<PaymentMethodInsert, 'id'>>
type PaymentMethodRow = typeof paymentMethods.$inferSelect

type PaymentMethodLocationInsert = typeof paymentMethodLocations.$inferInsert
type PaymentMethodLocationRow = typeof paymentMethodLocations.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: PaymentMethodRow): PaymentMethodDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		isActive: row.isActive === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

/** Maps a location assignment row to DTO. */
function toLocationDto(row: PaymentMethodLocationRow): PaymentMethodLocationDto {
	return {
		id: row.id,
		paymentMethodId: row.paymentMethodId,
		locationId: row.locationId,
		isEnabled: row.isEnabled === 1,
	}
}

// ─── Interface ───

export interface IPaymentMethodRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<PaymentMethodDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<PaymentMethodDto[]>
	findMany(db?: DbContext): Promise<PaymentMethodDto[]>
	findPage(
		filter: PaymentMethodFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<PaymentMethodDto>>
	insert(data: PaymentMethodInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: PaymentMethodUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, data: PaymentMethodUpdate, db?: DbContext): Promise<EntityRef | undefined>

	// Location assignment
	findByLocation(locationId: number, db?: DbContext): Promise<PaymentMethodDto[]>
	findLocationAssignment(
		paymentMethodId: number,
		locationId: number,
		db?: DbContext,
	): Promise<PaymentMethodLocationDto | undefined>
	upsertLocationAssignment(
		data: PaymentMethodLocationInsert,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	removeLocationAssignment(
		paymentMethodId: number,
		locationId: number,
		db?: DbContext,
	): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class PaymentMethodRepo implements IPaymentMethodRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<PaymentMethodDto | undefined> {
		const row = await db
			.select()
			.from(paymentMethods)
			.where(eq(paymentMethods.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<PaymentMethodDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(paymentMethods).where(inArray(paymentMethods.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext = this.db): Promise<PaymentMethodDto[]> {
		const rows = await db.select().from(paymentMethods)
		return rows.map(toDto)
	}

	async findPage(
		filter: PaymentMethodFilterDto,
		db: DbContext = this.db,
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

	async insert(
		data: PaymentMethodInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(paymentMethods)
			.values(data)
			.returning({ id: paymentMethods.id })
		return result
	}

	async update(
		id: number,
		data: PaymentMethodUpdate,
		db: DbContext = this.db,
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
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(paymentMethods)
			.set({ ...data, isActive: 0 })
			.where(eq(paymentMethods.id, id))
			.returning({ id: paymentMethods.id })
		return result
	}

	// ─── Location Assignment ───

	async findByLocation(locationId: number, db: DbContext = this.db): Promise<PaymentMethodDto[]> {
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
					eq(paymentMethodLocations.isEnabled, 1),
					eq(paymentMethods.isActive, 1),
				),
			)
			.orderBy(sql`${paymentMethods.name} asc`)

		return rows.map(toDto)
	}

	async findLocationAssignment(
		paymentMethodId: number,
		locationId: number,
		db: DbContext = this.db,
	): Promise<PaymentMethodLocationDto | undefined> {
		const row = await db
			.select()
			.from(paymentMethodLocations)
			.where(
				and(
					eq(paymentMethodLocations.paymentMethodId, paymentMethodId),
					eq(paymentMethodLocations.locationId, locationId),
				),
			)
			.limit(1)
			.then(takeFirst)
		return row ? toLocationDto(row) : undefined
	}

	async upsertLocationAssignment(
		data: PaymentMethodLocationInsert,
		db: DbContext = this.db,
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
		db: DbContext = this.db,
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

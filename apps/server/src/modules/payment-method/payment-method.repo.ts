import { paymentMethods, paymentMethodLocations } from '@/db/schema/pos.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { SoftDeleteCrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, and, eq, eqIf, searchAcross, sql, takeFirst } from '@/infra/database/index.ts'
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
		isActive: row.isActive,
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
		isEnabled: row.isEnabled,
	}
}

// ─── Interface ───

export interface IPaymentMethodRepo extends SoftDeleteCrudRepo<
	PaymentMethodDto,
	PaymentMethodInsert
> {
	findPage(
		filter: PaymentMethodFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<PaymentMethodDto>>

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

export function createPaymentMethodRepo(baseDb: DbContext): IPaymentMethodRepo {
	const crud = createCrudRepo({ db: baseDb, table: paymentMethods, toDto, softDelete: true })

	return {
		...crud,

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						searchAcross(filter.q, [paymentMethods.code, paymentMethods.name]),
						eqIf(paymentMethods.type, filter.type),
					),
				},
				db,
			),

		// ─── Location Assignment ───

		async findByLocation(locationId, db = baseDb) {
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
		},

		async findLocationAssignment(paymentMethodId, locationId, db = baseDb) {
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
		},

		async upsertLocationAssignment(data, db = baseDb) {
			const [result] = await db
				.insert(paymentMethodLocations)
				.values(data)
				.onConflictDoUpdate({
					target: [paymentMethodLocations.paymentMethodId, paymentMethodLocations.locationId],
					set: { isEnabled: data.isEnabled },
				})
				.returning({ id: paymentMethodLocations.id })
			return result
		},

		async removeLocationAssignment(paymentMethodId, locationId, db = baseDb) {
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
		},
	}
}

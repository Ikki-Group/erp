import { and, count, eq, SQL } from 'drizzle-orm'

import { locationPaymentMethodsTable } from '@/db/schema'

import { paginate, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
} from './location-payment-method.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type LocationPaymentMethodInsert = typeof locationPaymentMethodsTable.$inferInsert
type LocationPaymentMethodUpdate = PgUpdateSetSource<typeof locationPaymentMethodsTable>

export type { LocationPaymentMethodInsert, LocationPaymentMethodUpdate }

export interface ILocationPaymentMethodRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<LocationPaymentMethodDto | undefined>
	findByLocation(locationId: number, db?: DbContext): Promise<LocationPaymentMethodDto[]>
	findPage(filter: LocationPaymentMethodFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationPaymentMethodDto>>
	insert(data: LocationPaymentMethodInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationPaymentMethodUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	removeByLocation(locationId: number, db?: DbContext): Promise<number>
	unsetDefaultForLocation(locationId: number, db?: DbContext): Promise<void>
}

export class LocationPaymentMethodRepo implements ILocationPaymentMethodRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<LocationPaymentMethodFilterDto>): SQL | undefined {
		const { locationId, paymentMethodId, paymentProviderId, isEnabled } = filter
		return and(
			locationId === undefined ? undefined : eq(locationPaymentMethodsTable.locationId, locationId),
			paymentMethodId === undefined ? undefined : eq(locationPaymentMethodsTable.paymentMethodId, paymentMethodId),
			paymentProviderId === undefined ? undefined : eq(locationPaymentMethodsTable.paymentProviderId, paymentProviderId),
			isEnabled === undefined ? undefined : eq(locationPaymentMethodsTable.isEnabled, isEnabled),
		)
	}

	async findById(id: number, db: DbContext = this.db): Promise<LocationPaymentMethodDto | undefined> {
		return db
			.select()
			.from(locationPaymentMethodsTable)
			.where(eq(locationPaymentMethodsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findByLocation(locationId: number, db: DbContext = this.db): Promise<LocationPaymentMethodDto[]> {
		return db
			.select()
			.from(locationPaymentMethodsTable)
			.where(eq(locationPaymentMethodsTable.locationId, locationId))
			.orderBy(locationPaymentMethodsTable.isDefault, locationPaymentMethodsTable.createdAt)
	}

	async findPage(
		filter: LocationPaymentMethodFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<LocationPaymentMethodDto>> {
		const where = this.#buildWhere(filter)

		return paginate<LocationPaymentMethodDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(locationPaymentMethodsTable)
					.where(where)
					.orderBy(sortBy(locationPaymentMethodsTable.createdAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(locationPaymentMethodsTable).where(where),
		})
	}

	async insert(data: LocationPaymentMethodInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(locationPaymentMethodsTable)
			.values({ ...data })
			.returning({ id: locationPaymentMethodsTable.id })

		return res
	}

	async update(
		id: number,
		data: LocationPaymentMethodUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(locationPaymentMethodsTable)
			.set({ ...data })
			.where(eq(locationPaymentMethodsTable.id, id))
			.returning({ id: locationPaymentMethodsTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(locationPaymentMethodsTable)
			.where(eq(locationPaymentMethodsTable.id, id))
			.returning({ id: locationPaymentMethodsTable.id })
		return res
	}

	async removeByLocation(locationId: number, db: DbContext = this.db): Promise<number> {
		const result = await db
			.delete(locationPaymentMethodsTable)
			.where(eq(locationPaymentMethodsTable.locationId, locationId))
			.returning({ id: locationPaymentMethodsTable.id })

		return result.length
	}

	async unsetDefaultForLocation(locationId: number, db: DbContext = this.db): Promise<void> {
		await db
			.update(locationPaymentMethodsTable)
			.set({ isDefault: false })
			.where(
				and(
					eq(locationPaymentMethodsTable.locationId, locationId),
					eq(locationPaymentMethodsTable.isDefault, true),
				),
			)
	}
}

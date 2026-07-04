import { and, count, eq, or, SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { paymentProvidersTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentProviderDto,
	PaymentProviderFilterDto,
} from './payment-provider.contract'

type PaymentProviderInsert = typeof paymentProvidersTable.$inferInsert
type PaymentProviderUpdate = PgUpdateSetSource<typeof paymentProvidersTable>

export interface IPaymentProviderRepo {
	readonly db: DbContext
	findMany(filter?: Partial<Pick<PaymentProviderFilterDto, 'q' | 'isActive' | 'isSystem'>>, db?: DbContext): Promise<PaymentProviderDto[]>
	findPage(filter: PaymentProviderFilterDto, db?: DbContext): Promise<WithPaginationResult<PaymentProviderDto>>
	findById(id: number, db?: DbContext): Promise<PaymentProviderDto | undefined>
	findByCode(code: string, db?: DbContext): Promise<PaymentProviderDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: PaymentProviderInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: PaymentProviderUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class PaymentProviderRepo implements IPaymentProviderRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(
		filter?: Partial<Pick<PaymentProviderFilterDto, 'q' | 'isActive' | 'isSystem'>>,
	): SQL | undefined {
		const { q, isActive, isSystem } = filter ?? {}
		return and(
			q === undefined
				? undefined
				: or(
						searchFilter(paymentProvidersTable.name, q),
						searchFilter(paymentProvidersTable.code, q),
					),
			isActive === undefined ? undefined : eq(paymentProvidersTable.isActive, isActive),
			isSystem === undefined ? undefined : eq(paymentProvidersTable.isSystem, isSystem),
		)
	}

	async findMany(
		filter: Partial<Pick<PaymentProviderFilterDto, 'q' | 'isActive' | 'isSystem'>> = {},
		db: DbContext = this.db,
	): Promise<PaymentProviderDto[]> {
		const where = this.#buildWhere(filter)
		return db
			.select()
			.from(paymentProvidersTable)
			.where(where)
			.orderBy(paymentProvidersTable.name)
	}

	async findPage(
		filter: PaymentProviderFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<PaymentProviderDto>> {
		const where = this.#buildWhere(filter)

		return paginate<PaymentProviderDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(paymentProvidersTable)
					.where(where)
					.orderBy(sortBy(paymentProvidersTable.createdAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () =>
				db.select({ count: count() }).from(paymentProvidersTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<PaymentProviderDto | undefined> {
		return db
			.select()
			.from(paymentProvidersTable)
			.where(eq(paymentProvidersTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findByCode(
		code: string,
		db: DbContext = this.db,
	): Promise<PaymentProviderDto | undefined> {
		return db
			.select()
			.from(paymentProvidersTable)
			.where(eq(paymentProvidersTable.code, code))
			.limit(1)
			.then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(paymentProvidersTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(
		data: PaymentProviderInsert,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(paymentProvidersTable)
			.values({ ...data })
			.returning({ id: paymentProvidersTable.id })
		return res
	}

	async update(
		id: number,
		data: PaymentProviderUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(paymentProvidersTable)
			.set({ ...data })
			.where(eq(paymentProvidersTable.id, id))
			.returning({ id: paymentProvidersTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(paymentProvidersTable)
			.where(eq(paymentProvidersTable.id, id))
			.returning({ id: paymentProvidersTable.id })
		return res
	}
}

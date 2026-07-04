import { and, count, eq, SQL } from 'drizzle-orm'

import { paymentMethodsTable } from '@/db/schema'

import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentMethodDto,
	PaymentMethodFilterDto,
} from './payment-method.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

export type PaymentMethodInsert = typeof paymentMethodsTable.$inferInsert
export type PaymentMethodUpdate = PgUpdateSetSource<typeof paymentMethodsTable>

export interface IPaymentMethodRepo {
	readonly db: DbContext
	findMany(filter?: Partial<Pick<PaymentMethodFilterDto, 'q' | 'category' | 'isEnabled' | 'isGlobal'>>, db?: DbContext): Promise<PaymentMethodDto[]>
	findPage(filter: PaymentMethodFilterDto, db?: DbContext): Promise<WithPaginationResult<PaymentMethodDto>>
	findById(id: number, db?: DbContext): Promise<PaymentMethodDto | undefined>
	findEnabled(db?: DbContext): Promise<PaymentMethodDto[]>
	findGlobal(db?: DbContext): Promise<PaymentMethodDto[]>
	count(db?: DbContext): Promise<number>
	insert(data: PaymentMethodInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: PaymentMethodUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: PaymentMethodInsert[], db?: DbContext): Promise<void>
	seed(data: (PaymentMethodInsert & { createdBy: number })[], db?: DbContext): Promise<void>
}

export class PaymentMethodRepo implements IPaymentMethodRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter?: Partial<Pick<PaymentMethodFilterDto, 'q' | 'category' | 'isEnabled' | 'isGlobal'>>): SQL | undefined {
		if (!filter) return undefined

		const { q, category, isEnabled, isGlobal } = filter
		return and(
			q === undefined ? undefined : searchFilter(paymentMethodsTable.name, q),
			category === undefined ? undefined : eq(paymentMethodsTable.category, category),
			isEnabled === undefined ? undefined : eq(paymentMethodsTable.isEnabled, isEnabled),
			isGlobal === undefined ? undefined : eq(paymentMethodsTable.isGlobal, isGlobal),
		)
	}

	async findMany(
		filter?: Partial<Pick<PaymentMethodFilterDto, 'q' | 'category' | 'isEnabled' | 'isGlobal'>>,
		db: DbContext = this.db,
	): Promise<PaymentMethodDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(paymentMethodsTable).where(where)
	}

	async findPage(
		filter: PaymentMethodFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<PaymentMethodDto>> {
		const { q, page, limit, category, isEnabled, isGlobal } = filter
		const where = this.#buildWhere({ q, category, isEnabled, isGlobal })

		return paginate<PaymentMethodDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(paymentMethodsTable)
					.where(where)
					.orderBy(paymentMethodsTable.name)
					.limit(limit)
					.offset(offset),
			pq: { page, limit },
			countQuery: () => db.select({ count: count() }).from(paymentMethodsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<PaymentMethodDto | undefined> {
		return db
			.select()
			.from(paymentMethodsTable)
			.where(eq(paymentMethodsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findEnabled(db: DbContext = this.db): Promise<PaymentMethodDto[]> {
		return db
			.select()
			.from(paymentMethodsTable)
			.where(eq(paymentMethodsTable.isEnabled, true))
	}

	async findGlobal(db: DbContext = this.db): Promise<PaymentMethodDto[]> {
		return db
			.select()
			.from(paymentMethodsTable)
			.where(and(
				eq(paymentMethodsTable.isEnabled, true),
				eq(paymentMethodsTable.isGlobal, true),
			))
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(paymentMethodsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: PaymentMethodInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(paymentMethodsTable)
			.values({ ...data })
			.returning({ id: paymentMethodsTable.id })

		return res
	}

	async update(id: number, data: PaymentMethodUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(paymentMethodsTable)
			.set({ ...data })
			.where(eq(paymentMethodsTable.id, id))
			.returning({ id: paymentMethodsTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(paymentMethodsTable)
			.where(eq(paymentMethodsTable.id, id))
			.returning({ id: paymentMethodsTable.id })
		return res
	}

	async insertMany(items: PaymentMethodInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(paymentMethodsTable).values(items).onConflictDoNothing()
	}

	async seed(data: (PaymentMethodInsert & { createdBy: number })[], db: DbContext = this.db): Promise<void> {
		for (const d of data) {
			await db
				.insert(paymentMethodsTable)
				.values({ ...d })
				.onConflictDoUpdate({
					target: paymentMethodsTable.name,
					set: {
						type: d.type,
						category: d.category,
						isEnabled: d.isEnabled,
						isDefault: d.isDefault,
						isGlobal: d.isGlobal,
						paymentProviderId: d.paymentProviderId,
						updatedAt: d.updatedAt,
						updatedBy: d.updatedBy,
					},
				})
		}
	}
}

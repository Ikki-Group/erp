import { and, count, eq, gte, lte, or, type SQL } from 'drizzle-orm'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

import { paymentInvoicesTable, paymentsTable } from '@/db/schema'

import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	PaymentDto,
	PaymentFilterDto,
	PaymentInvoiceDto,
} from './payment.contract'

type PaymentInsert = typeof paymentsTable.$inferInsert
type PaymentUpdate = PgUpdateSetSource<typeof paymentsTable>

export interface IPaymentRepo {
	readonly db: DbContext
	findMany(filter?: Partial<PaymentFilterDto>, db?: DbContext): Promise<PaymentDto[]>
	findPage(filter: PaymentFilterDto, db?: DbContext): Promise<WithPaginationResult<PaymentDto>>
	findById(id: number, db?: DbContext): Promise<PaymentDto | undefined>
	count(db?: DbContext): Promise<number>
	findPaymentInvoicesByPaymentId(paymentId: number, db?: DbContext): Promise<PaymentInvoiceDto[]>
	insert(data: PaymentInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: PaymentUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class PaymentRepo implements IPaymentRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<
		Pick<PaymentFilterDto, 'q' | 'type' | 'method' | 'accountId' | 'dateFrom' | 'dateTo'>
	>): SQL | undefined {
		const { q, type, method, accountId, dateFrom, dateTo } = filter
		return and(
			q === undefined
				? undefined
				: or(searchFilter(paymentsTable.referenceNo, q), searchFilter(paymentsTable.notes, q)),
			type === undefined ? undefined : eq(paymentsTable.type, type),
			method === undefined ? undefined : eq(paymentsTable.method, method),
			accountId === undefined ? undefined : eq(paymentsTable.accountId, accountId),
			dateFrom === undefined ? undefined : gte(paymentsTable.date, dateFrom),
			dateTo === undefined ? undefined : lte(paymentsTable.date, dateTo),
		)
	}

	async findMany(
		filter: Partial<PaymentFilterDto> = {},
		db: DbContext = this.db,
	): Promise<PaymentDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(paymentsTable).where(where).orderBy(paymentsTable.date)
	}

	async findPage(
		filter: PaymentFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<PaymentDto>> {
		const where = this.#buildWhere(filter)

		return paginate<PaymentDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(paymentsTable)
					.where(where)
					.orderBy(paymentsTable.date)
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(paymentsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<PaymentDto | undefined> {
		return db
			.select()
			.from(paymentsTable)
			.where(eq(paymentsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(paymentsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async findPaymentInvoicesByPaymentId(
		paymentId: number,
		db: DbContext = this.db,
	): Promise<PaymentInvoiceDto[]> {
		return db
			.select()
			.from(paymentInvoicesTable)
			.where(eq(paymentInvoicesTable.paymentId, paymentId))
	}

	async insert(data: PaymentInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(paymentsTable)
			.values({ ...data })
			.returning({ id: paymentsTable.id })

		return res
	}

	async update(
		id: number,
		data: PaymentUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(paymentsTable)
			.set({ ...data })
			.where(eq(paymentsTable.id, id))
			.returning({ id: paymentsTable.id })

		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(paymentsTable)
			.where(eq(paymentsTable.id, id))
			.returning({ id: paymentsTable.id })

		return res
	}
}

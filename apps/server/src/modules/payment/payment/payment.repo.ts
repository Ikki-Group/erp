import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gte, lte, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { paymentInvoicesTable, paymentsTable } from '@/db/schema'

import * as dto from './payment.dto'

export class PaymentRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.PaymentFilterDto,
	): Promise<WithPaginationResult<dto.PaymentDto>> {
		return record('PaymentRepo.getListPaginated', async () => {
			const { q, page, limit, type, method, accountId, dateFrom, dateTo } = filter
			const where = and(
				q === undefined
					? undefined
					: or(searchFilter(paymentsTable.referenceNo, q), searchFilter(paymentsTable.notes, q)),
				type === undefined ? undefined : eq(paymentsTable.type, type),
				method === undefined ? undefined : eq(paymentsTable.method, method),
				accountId === undefined ? undefined : eq(paymentsTable.accountId, accountId),
				dateFrom === undefined ? undefined : gte(paymentsTable.date, dateFrom),
				dateTo === undefined ? undefined : lte(paymentsTable.date, dateTo),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(paymentsTable)
						.where(where)
						.orderBy(paymentsTable.date)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(paymentsTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.PaymentDto[]> {
		return record('PaymentRepo.getList', async () => {
			return this.db.select().from(paymentsTable)
		})
	}

	async getById(id: number): Promise<dto.PaymentDto | undefined> {
		return record('PaymentRepo.getById', async () => {
			const res = await this.db
				.select()
				.from(paymentsTable)
				.where(eq(paymentsTable.id, id))
				.limit(1)
				.then(takeFirst)
			return res
		})
	}

	async count(): Promise<number> {
		return record('PaymentRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(paymentsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	async getPaymentInvoicesByPaymentId(paymentId: number): Promise<dto.PaymentInvoiceDto[]> {
		return record('PaymentRepo.getPaymentInvoicesByPaymentId', async () => {
			return this.db
				.select()
				.from(paymentInvoicesTable)
				.where(eq(paymentInvoicesTable.paymentId, paymentId))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.PaymentCreateDto, actorId: number): Promise<number | undefined> {
		return record('PaymentRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const insertData = {
				...data,
				amount: typeof data.amount === 'string' ? data.amount : String(data.amount),
				...metadata,
			}
			const [res] = await this.db
				.insert(paymentsTable)
				.values(insertData)
				.returning({ id: paymentsTable.id })

			return res?.id
		})
	}

	async update(data: dto.PaymentUpdateDto, actorId: number): Promise<number | undefined> {
		return record('PaymentRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const updateData = {
				...data,
				amount: typeof data.amount === 'string' ? data.amount : String(data.amount),
				...metadata,
			}
			const [res] = await this.db
				.update(paymentsTable)
				.set(updateData)
				.where(eq(paymentsTable.id, data.id))
				.returning({ id: paymentsTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('PaymentRepo.remove', async () => {
			const [res] = await this.db
				.delete(paymentsTable)
				.where(eq(paymentsTable.id, id))
				.returning({ id: paymentsTable.id })

			return res?.id
		})
	}
}

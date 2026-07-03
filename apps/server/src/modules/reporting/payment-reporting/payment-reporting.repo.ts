import { and, count, eq, gte, lte, sql } from 'drizzle-orm'

import { accountsTable, paymentsTable } from '@/db/schema'

import type { DbClient } from '@/infra/database'

import { PaymentReportRequestDto } from './payment-reporting.contract'

export class PaymentReportingRepo {
	constructor(private readonly db: DbClient) {}

	private buildBaseWhere(query: PaymentReportRequestDto) {
		const { dateFrom, dateTo, accountId, method, type } = query
		return {
			dateFrom,
			dateTo,
			accountId,
			method,
			type,
		}
	}

	async getPaymentsByMethod(query: PaymentReportRequestDto) {
		const { dateFrom, dateTo, accountId, method, type } = this.buildBaseWhere(query)

		const where = and(
			gte(paymentsTable.date, dateFrom),
			lte(paymentsTable.date, dateTo),
			accountId ? eq(paymentsTable.accountId, accountId) : undefined,
			method
				? // @ts-expect-error
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					eq(paymentsTable.method, method as 'cash' | 'card' | 'e-wallet' | 'bank_transfer')
				: undefined,
			type ? eq(paymentsTable.type, type) : undefined,
		)

		return this.db
			.select({
				method: paymentsTable.method,
				totalAmount: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
				count: count(),
			})
			.from(paymentsTable)
			.where(where)
			.groupBy(paymentsTable.method)
			.orderBy(sql`totalAmount DESC`)
	}

	async getPaymentsOverTime(query: PaymentReportRequestDto) {
		const { dateFrom, dateTo, accountId, method, type, groupBy = 'day' } = query

		const where = and(
			gte(paymentsTable.date, dateFrom),
			lte(paymentsTable.date, dateTo),
			accountId ? eq(paymentsTable.accountId, accountId) : undefined,
			method
				? // @ts-expect-error
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					eq(paymentsTable.method, method as 'cash' | 'card' | 'e-wallet' | 'bank_transfer')
				: undefined,
			type ? eq(paymentsTable.type, type) : undefined,
		)

		let dateTrunc
		switch (groupBy) {
			case 'day':
				dateTrunc = sql`DATE(${paymentsTable.date})`
				break
			case 'week':
				dateTrunc = sql`DATE_TRUNC('week', ${paymentsTable.date})`
				break
			case 'month':
				dateTrunc = sql`DATE_TRUNC('month', ${paymentsTable.date})`
				break
			case 'year':
				dateTrunc = sql`DATE_TRUNC('year', ${paymentsTable.date})`
				break
		}

		return this.db
			.select({
				date: dateTrunc,
				payableAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentsTable.type} = 'payable' THEN ${paymentsTable.amount} ELSE 0 END), 0)`,
				receivableAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentsTable.type} = 'receivable' THEN ${paymentsTable.amount} ELSE 0 END), 0)`,
			})
			.from(paymentsTable)
			.where(where)
			.groupBy(dateTrunc)
			.orderBy(dateTrunc)
	}

	async getPaymentsByAccount(query: PaymentReportRequestDto) {
		const { dateFrom, dateTo, method, type } = query

		const where = and(
			gte(paymentsTable.date, dateFrom),
			lte(paymentsTable.date, dateTo),
			method
				? // @ts-expect-error
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					eq(paymentsTable.method, method as 'cash' | 'card' | 'e-wallet' | 'bank_transfer')
				: undefined,
			type ? eq(paymentsTable.type, type) : undefined,
		)

		return this.db
			.select({
				accountId: accountsTable.id,
				accountName: accountsTable.name,
				accountCode: accountsTable.code,
				totalAmount: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
				count: count(),
			})
			.from(paymentsTable)
			.innerJoin(accountsTable, eq(paymentsTable.accountId, accountsTable.id))
			.where(where)
			.groupBy(accountsTable.id, accountsTable.name, accountsTable.code)
			.orderBy(sql`totalAmount DESC`)
	}
}

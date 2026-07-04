import { and, eq, gte, lte, sql } from 'drizzle-orm'

import { accountsTable, expendituresTable } from '@/db/schema'

import type { DbContext } from '@/infra/database'

import { FinanceReportRequestDto } from './finance-reporting.contract'

export interface IFinanceReportingRepo {
	readonly db: DbContext
	getExpenditureByCategory(
		query: FinanceReportRequestDto,
	): Promise<Array<{ categoryId: number; categoryName: string; totalAmount: number }>>
}

export class FinanceReportingRepo implements IFinanceReportingRepo {
	constructor(readonly db: DbContext) {}

	async getExpenditureByCategory(query: FinanceReportRequestDto) {
		const { dateFrom, dateTo, locationId, accountId } = query

		const where = and(
			gte(expendituresTable.date, dateFrom),
			lte(expendituresTable.date, dateTo),
			locationId ? eq(expendituresTable.locationId, locationId) : undefined,
			accountId ? eq(expendituresTable.targetAccountId, accountId) : undefined,
		)

		return this.db
			.select({
				categoryId: expendituresTable.targetAccountId,
				categoryName: accountsTable.name,
				totalAmount: sql<number>`COALESCE(SUM(${expendituresTable.amount}), 0)`,
			})
			.from(expendituresTable)
			.innerJoin(accountsTable, eq(expendituresTable.targetAccountId, accountsTable.id))
			.where(where)
			.groupBy(expendituresTable.targetAccountId, accountsTable.name)
			.orderBy(sql`totalAmount DESC`)
	}
}

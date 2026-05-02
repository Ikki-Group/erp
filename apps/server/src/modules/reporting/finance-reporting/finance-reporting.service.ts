import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import { accountsTable, expendituresTable } from '@/db/schema'

import * as dto from './finance-reporting.dto'

export class FinanceReportingService {
	constructor(private readonly db: DbClient) {}

	async getCashFlow(_query: dto.FinanceReportRequestDto): Promise<dto.CashFlowChartResponseDto> {
		return record('FinanceReportingService.getCashFlow', async () => {
			// TODO: Implement general ledger table and cash flow reporting
			throw new Error(
				'Cash flow reporting not yet implemented - generalLedgerTable needs to be created',
			)
		})
	}

	async getAccountBalances(
		query: dto.FinanceReportRequestDto,
	): Promise<dto.AccountBalanceResponseDto> {
		return record('FinanceReportingService.getAccountBalances', async () => {
			// TODO: Implement balance calculation from journal entries
			throw new Error(
				'Account balance reporting not yet implemented - requires journal entry aggregation',
			)
		})
	}

	async getExpenditureByCategory(
		query: dto.FinanceReportRequestDto,
	): Promise<dto.ExpenditureByCategoryResponseDto> {
		return record('FinanceReportingService.getExpenditureByCategory', async () => {
			const { dateFrom, dateTo, locationId, accountId } = query

			const where = and(
				gte(expendituresTable.date, dateFrom),
				lte(expendituresTable.date, dateTo),
				locationId ? eq(expendituresTable.locationId, locationId) : undefined,
				accountId ? eq(expendituresTable.targetAccountId, accountId) : undefined,
			)

			const data = await this.db
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

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					categoryId: d.categoryId,
					categoryName: d.categoryName,
					totalAmount: String(d.totalAmount),
					percentage: totalAmount > 0 ? String((Number(d.totalAmount) / totalAmount) * 100) : '0',
				})),
				summary: {
					total: String(totalAmount),
					average: totalAmount > 0 ? String(totalAmount / data.length) : '0',
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)))),
					count: data.length,
				},
			}
		})
	}

	get routes() {
		const { Elysia } = require('elysia')
		const { authPluginMacro } = require('@/core/http/auth-macro')
		const { res } = require('@/core/http/response')
		const { createSuccessResponseSchema } = require('@/core/validation')

		return new Elysia({ prefix: '/finance' })
			.use(authPluginMacro)
			.get(
				'/cash-flow',
				async ({ query }: { query: dto.FinanceReportRequestDto }) => {
					const result = await this.getCashFlow(query)
					return res.ok(result)
				},
				{
					query: dto.FinanceReportRequestDto,
					response: createSuccessResponseSchema(dto.CashFlowChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/account-balances',
				async ({ query }: { query: dto.FinanceReportRequestDto }) => {
					const result = await this.getAccountBalances(query)
					return res.ok(result)
				},
				{
					query: dto.FinanceReportRequestDto,
					response: createSuccessResponseSchema(dto.AccountBalanceResponseDto),
					auth: true,
				},
			)
			.get(
				'/expenditure-by-category',
				async ({ query }: { query: dto.FinanceReportRequestDto }) => {
					const result = await this.getExpenditureByCategory(query)
					return res.ok(result)
				},
				{
					query: dto.FinanceReportRequestDto,
					response: createSuccessResponseSchema(dto.ExpenditureByCategoryResponseDto),
					auth: true,
				},
			)
	}
}

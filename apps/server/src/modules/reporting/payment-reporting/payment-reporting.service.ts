import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { accountsTable, paymentsTable } from '@/db/schema'

import * as dto from './payment-reporting.dto'

export class PaymentReportingService {
	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {}

	async getPaymentsByMethod(query: dto.PaymentReportRequestDto): Promise<dto.PaymentByMethodResponseDto> {
		return record('PaymentReportingService.getPaymentsByMethod', async () => {
			const { dateFrom, dateTo, locationId, accountId, method, type } = query

			const where = and(
				gte(paymentsTable.date, dateFrom),
				lte(paymentsTable.date, dateTo),
				accountId ? eq(paymentsTable.accountId, accountId) : undefined,
				method ? eq(paymentsTable.method, method) : undefined,
				type ? eq(paymentsTable.type, type) : undefined,
			)

			const data = await this.db
				.select({
					method: paymentsTable.method,
					totalAmount: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
					count: sql<number>`COUNT(*)`,
				})
				.from(paymentsTable)
				.where(where)
				.groupBy(paymentsTable.method)
				.orderBy(sql`totalAmount DESC`)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)

			return {
				chartType: 'pie',
				data: data.map((d) => ({
					method: d.method,
					category: d.method === 'cash' ? 'cash' : 'cashless',
					totalAmount: String(d.totalAmount),
					count: d.count,
					percentage: totalAmount > 0 ? String((Number(d.totalAmount) / totalAmount) * 100) : '0',
				})),
				summary: {
					total: String(totalAmount),
					average: String(totalAmount / (data.length || 1)),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)))),
					count: data.length,
				},
			}
		})
	}

	async getPaymentsOverTime(query: dto.PaymentReportRequestDto): Promise<dto.PaymentOverTimeResponseDto> {
		return record('PaymentReportingService.getPaymentsOverTime', async () => {
			const { dateFrom, dateTo, locationId, accountId, method, type, groupBy = 'day' } = query

			const where = and(
				gte(paymentsTable.date, dateFrom),
				lte(paymentsTable.date, dateTo),
				accountId ? eq(paymentsTable.accountId, accountId) : undefined,
				method ? eq(paymentsTable.method, method) : undefined,
				type ? eq(paymentsTable.type, type) : undefined,
			)

			let dateTrunc: string
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

			const data = await this.db
				.select({
					date: dateTrunc,
					payableAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentsTable.type} = 'payable' THEN ${paymentsTable.amount} ELSE 0 END), 0)`,
					receivableAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentsTable.type} = 'receivable' THEN ${paymentsTable.amount} ELSE 0 END), 0)`,
				})
				.from(paymentsTable)
				.where(where)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc)

			const totalPayable = data.reduce((sum, d) => sum + Number(d.payableAmount), 0)
			const totalReceivable = data.reduce((sum, d) => sum + Number(d.receivableAmount), 0)

			return {
				chartType: 'line',
				data: data.map((d) => ({
					date: d.date as string,
					payableAmount: String(d.payableAmount),
					receivableAmount: String(d.receivableAmount),
					totalAmount: String(Number(d.payableAmount) + Number(d.receivableAmount)),
				})),
				summary: {
					total: String(totalPayable + totalReceivable),
					average: String((totalPayable + totalReceivable) / (data.length || 1)),
					min: String(Math.min(...data.map((d) => Number(d.payableAmount) + Number(d.receivableAmount)))),
					max: String(Math.max(...data.map((d) => Number(d.payableAmount) + Number(d.receivableAmount)))),
					count: data.length,
				},
			}
		})
	}

	async getPaymentsByAccount(query: dto.PaymentReportRequestDto): Promise<dto.PaymentByAccountResponseDto> {
		return record('PaymentReportingService.getPaymentsByAccount', async () => {
			const { dateFrom, dateTo, locationId, method, type } = query

			const where = and(
				gte(paymentsTable.date, dateFrom),
				lte(paymentsTable.date, dateTo),
				method ? eq(paymentsTable.method, method) : undefined,
				type ? eq(paymentsTable.type, type) : undefined,
			)

			const data = await this.db
				.select({
					accountId: accountsTable.id,
					accountName: accountsTable.name,
					accountCode: accountsTable.code,
					totalAmount: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
					count: sql<number>`COUNT(*)`,
				})
				.from(paymentsTable)
				.innerJoin(accountsTable, eq(paymentsTable.accountId, accountsTable.id))
				.where(where)
				.groupBy(accountsTable.id, accountsTable.name, accountsTable.code)
				.orderBy(sql`totalAmount DESC`)

			const totalAmount = data.reduce((sum, d) => sum + Number(d.totalAmount), 0)
			const avgAmount = data.length > 0 ? totalAmount / data.length : 0

			return {
				chartType: 'bar',
				data: data.map((d) => ({
					accountId: d.accountId,
					accountName: d.accountName,
					accountCode: d.accountCode,
					totalAmount: String(d.totalAmount),
					count: d.count,
				})),
				summary: {
					total: String(totalAmount),
					average: String(avgAmount),
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

		return new Elysia({ prefix: '/payment' })
			.use(authPluginMacro)
			.get(
				'/by-method',
				async ({ query }) => {
					const result = await this.getPaymentsByMethod(query)
					return res.ok(result)
				},
				{
					query: dto.PaymentReportRequestDto,
					response: createSuccessResponseSchema(dto.PaymentByMethodResponseDto),
					auth: true,
				},
			)
			.get(
				'/over-time',
				async ({ query }) => {
					const result = await this.getPaymentsOverTime(query)
					return res.ok(result)
				},
				{
					query: dto.PaymentReportRequestDto,
					response: createSuccessResponseSchema(dto.PaymentOverTimeResponseDto),
					auth: true,
				},
			)
			.get(
				'/by-account',
				async ({ query }) => {
					const result = await this.getPaymentsByAccount(query)
					return res.ok(result)
				},
				{
					query: dto.PaymentReportRequestDto,
					response: createSuccessResponseSchema(dto.PaymentByAccountResponseDto),
					auth: true,
				},
			)
	}
}

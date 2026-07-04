import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './finance-reporting.contract'
import type { FinanceReportingModule } from './finance-reporting.module'

export function createFinanceReportingRoute(m: FinanceReportingModule) {
	return new Elysia({ prefix: '/finance' })
		.use(authPluginMacro)
		.get(
			'/cash-flow',
			async ({ query }) => {
				const result = await m.handleGetCashFlow(query)
				return res.ok(result)
			},
			{
				query: dto.FinanceReportRequestDto,
				response: createSuccessResponseDto(dto.CashFlowChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/account-balances',
			async ({ query }) => {
				const result = await m.handleGetAccountBalances(query)
				return res.ok(result)
			},
			{
				query: dto.FinanceReportRequestDto,
				response: createSuccessResponseDto(dto.AccountBalanceResponseDto),
				auth: true,
			},
		)
		.get(
			'/expenditure-by-category',
			async ({ query }) => {
				const result = await m.handleGetExpenditureByCategory(query)
				return res.ok(result)
			},
			{
				query: dto.FinanceReportRequestDto,
				response: createSuccessResponseDto(dto.ExpenditureByCategoryResponseDto),
				auth: true,
			},
		)
}

import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './finance-reporting.dto'
import type { FinanceReportingService } from './finance-reporting.service'
import { createSuccessResponseSchema } from '@/lib/validation'

export function initFinanceReportingRoute(service: FinanceReportingService) {
	return new Elysia({ prefix: '/finance' })
		.use(authPluginMacro)
		.get(
			'/cash-flow',
			async ({ query }: { query: dto.FinanceReportRequestDto }) => {
				const result = await service.getCashFlow(query)
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
				const result = await service.getAccountBalances(query)
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
				const result = await service.getExpenditureByCategory(query)
				return res.ok(result)
			},
			{
				query: dto.FinanceReportRequestDto,
				response: createSuccessResponseSchema(dto.ExpenditureByCategoryResponseDto),
				auth: true,
			},
		)
}

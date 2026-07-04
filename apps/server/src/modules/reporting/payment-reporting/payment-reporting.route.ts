import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './payment-reporting.contract'
import type { PaymentReportingModule } from './payment-reporting.module'

export function createPaymentReportingRoute(m: PaymentReportingModule) {
	return new Elysia({ prefix: '/payment' })
		.use(authPluginMacro)
		.get(
			'/by-method',
			async ({ query }) => {
				const result = await m.handleGetPaymentsByMethod(query)
				return res.ok(result)
			},
			{
				query: dto.PaymentReportRequestDto,
				response: createSuccessResponseDto(dto.PaymentByMethodResponseDto),
				auth: true,
			},
		)
		.get(
			'/over-time',
			async ({ query }) => {
				const result = await m.handleGetPaymentsOverTime(query)
				return res.ok(result)
			},
			{
				query: dto.PaymentReportRequestDto,
				response: createSuccessResponseDto(dto.PaymentOverTimeResponseDto),
				auth: true,
			},
		)
		.get(
			'/by-account',
			async ({ query }) => {
				const result = await m.handleGetPaymentsByAccount(query)
				return res.ok(result)
			},
			{
				query: dto.PaymentReportRequestDto,
				response: createSuccessResponseDto(dto.PaymentByAccountResponseDto),
				auth: true,
			},
		)
}

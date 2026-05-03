import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './payment-reporting.dto'
import type { PaymentReportingService } from './payment-reporting.service'
import { createSuccessResponseSchema } from '@/lib/validation'

export function initPaymentReportingRoute(service: PaymentReportingService) {
	return new Elysia({ prefix: '/payment' })
		.use(authPluginMacro)
		.get(
			'/by-method',
			async ({ query }: { query: dto.PaymentReportRequestDto }) => {
				const result = await service.getPaymentsByMethod(query)
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
			async ({ query }: { query: dto.PaymentReportRequestDto }) => {
				const result = await service.getPaymentsOverTime(query)
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
			async ({ query }: { query: dto.PaymentReportRequestDto }) => {
				const result = await service.getPaymentsByAccount(query)
				return res.ok(result)
			},
			{
				query: dto.PaymentReportRequestDto,
				response: createSuccessResponseSchema(dto.PaymentByAccountResponseDto),
				auth: true,
			},
		)
}

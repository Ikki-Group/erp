import { createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './payment-reporting.contract'
import type { PaymentReportingService } from './payment-reporting.service'

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
				response: createSuccessResponseDto(dto.PaymentByMethodResponseDto),
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
				response: createSuccessResponseDto(dto.PaymentOverTimeResponseDto),
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
				response: createSuccessResponseDto(dto.PaymentByAccountResponseDto),
				auth: true,
			},
		)
}

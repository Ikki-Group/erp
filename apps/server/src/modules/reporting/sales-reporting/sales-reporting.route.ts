import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './sales-reporting.dto'
import type { SalesReportingService } from './sales-reporting.service'
import { createSuccessResponseSchema } from '@/lib/validation'

export function initSalesReportingRoute(service: SalesReportingService) {
	return new Elysia({ prefix: '/sales' })
		.use(authPluginMacro)
		.get(
			'/revenue',
			async ({ query }: { query: dto.SalesReportRequestDto }) => {
				const result = await service.getRevenueOverTime(query)
				return res.ok(result)
			},
			{
				query: dto.SalesReportRequestDto,
				response: createSuccessResponseSchema(dto.SalesRevenueChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/top-products',
			async ({ query }: { query: dto.SalesReportRequestDto }) => {
				const result = await service.getTopProducts(query)
				return res.ok(result)
			},
			{
				query: dto.SalesReportRequestDto,
				response: createSuccessResponseSchema(dto.TopProductsChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/by-location',
			async ({ query }: { query: dto.SalesReportRequestDto }) => {
				const result = await service.getSalesByLocation(query)
				return res.ok(result)
			},
			{
				query: dto.SalesReportRequestDto,
				response: createSuccessResponseSchema(dto.SalesByLocationChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/by-type',
			async ({ query }: { query: dto.SalesReportRequestDto }) => {
				const result = await service.getSalesByType(query)
				return res.ok(result)
			},
			{
				query: dto.SalesReportRequestDto,
				response: createSuccessResponseSchema(dto.SalesByTypeChartResponseDto),
				auth: true,
			},
		)
}

import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './sales-reporting.contract'
import type { SalesReportingService } from './sales-reporting.service'

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
				response: createSuccessResponseDto(dto.SalesRevenueChartResponseDto),
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
				response: createSuccessResponseDto(dto.TopProductsChartResponseDto),
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
				response: createSuccessResponseDto(dto.SalesByLocationChartResponseDto),
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
				response: createSuccessResponseDto(dto.SalesByTypeChartResponseDto),
				auth: true,
			},
		)
}

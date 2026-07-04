import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './sales-reporting.contract'
import type { SalesReportingModule } from './sales-reporting.module'

export function createSalesReportingRoute(m: SalesReportingModule) {
	return new Elysia({ prefix: '/sales' })
		.use(authPluginMacro)
		.get(
			'/revenue',
			async ({ query }) => {
				const result = await m.handleGetRevenueOverTime(query)
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
			async ({ query }) => {
				const result = await m.handleGetTopProducts(query)
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
			async ({ query }) => {
				const result = await m.handleGetSalesByLocation(query)
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
			async ({ query }) => {
				const result = await m.handleGetSalesByType(query)
				return res.ok(result)
			},
			{
				query: dto.SalesReportRequestDto,
				response: createSuccessResponseDto(dto.SalesByTypeChartResponseDto),
				auth: true,
			},
		)
}

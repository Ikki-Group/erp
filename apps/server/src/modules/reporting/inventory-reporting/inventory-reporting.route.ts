import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import * as dto from './inventory-reporting.dto'
import type { InventoryReportingService } from './inventory-reporting.service'

export function initInventoryReportingRoute(service: InventoryReportingService) {
	return new Elysia({ prefix: '/inventory' })
		.use(authPluginMacro)
		.get(
			'/stock-levels',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getStockLevels(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseSchema(dto.StockLevelResponseDto),
				auth: true,
			},
		)
		.get(
			'/stock-value',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getStockValue(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseSchema(dto.StockValueResponseDto),
				auth: true,
			},
		)
		.get(
			'/low-stock',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getLowStockItems(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseSchema(dto.LowStockResponseDto),
				auth: true,
			},
		)
		.get(
			'/movements',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getInventoryMovements(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseSchema(dto.InventoryMovementChartResponseDto),
				auth: true,
			},
		)
}

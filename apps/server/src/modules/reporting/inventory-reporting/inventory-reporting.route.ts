import { createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './inventory-reporting.contract'
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
				response: createSuccessResponseDto(dto.StockLevelResponseDto),
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
				response: createSuccessResponseDto(dto.StockValueResponseDto),
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
				response: createSuccessResponseDto(dto.LowStockResponseDto),
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
				response: createSuccessResponseDto(dto.InventoryMovementChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/consumption',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getConsumptionReport(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseDto(dto.ConsumptionResponseDto),
				auth: true,
			},
		)
		.get(
			'/opname',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getOpnameReport(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseDto(dto.OpnameVarianceResponseDto),
				auth: true,
			},
		)
		.get(
			'/waste',
			async ({ query }: { query: dto.InventoryReportRequestDto }) => {
				const result = await service.getWasteReport(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseDto(dto.WasteResponseDto),
				auth: true,
			},
		)
}

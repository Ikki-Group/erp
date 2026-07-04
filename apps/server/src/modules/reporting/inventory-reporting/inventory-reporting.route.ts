import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './inventory-reporting.contract'
import type { InventoryReportingModule } from './inventory-reporting.module'

export function createInventoryReportingRoute(m: InventoryReportingModule) {
	return new Elysia({ prefix: '/inventory' })
		.use(authPluginMacro)
		.get(
			'/stock-levels',
			async ({ query }) => {
				const result = await m.handleGetStockLevels(query)
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
			async ({ query }) => {
				const result = await m.handleGetStockValue(query)
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
			async ({ query }) => {
				const result = await m.handleGetLowStockItems(query)
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
			async ({ query }) => {
				const result = await m.handleGetInventoryMovements(query)
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
			async ({ query }) => {
				const result = await m.handleGetConsumptionReport(query)
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
			async ({ query }) => {
				const result = await m.handleGetOpnameReport(query)
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
			async ({ query }) => {
				const result = await m.handleGetWasteReport(query)
				return res.ok(result)
			},
			{
				query: dto.InventoryReportRequestDto,
				response: createSuccessResponseDto(dto.WasteResponseDto),
				auth: true,
			},
		)
}

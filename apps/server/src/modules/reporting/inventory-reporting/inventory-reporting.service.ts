import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import * as dto from './inventory-reporting.dto'

export class InventoryReportingService {
	async getStockLevels(_query: dto.InventoryReportRequestDto): Promise<dto.StockLevelResponseDto> {
		return record('InventoryReportingService.getStockLevels', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getStockValue(_query: dto.InventoryReportRequestDto): Promise<dto.StockValueResponseDto> {
		return record('InventoryReportingService.getStockValue', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getLowStockItems(_query: dto.InventoryReportRequestDto): Promise<dto.LowStockResponseDto> {
		return record('InventoryReportingService.getLowStockItems', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	async getInventoryMovements(
		_query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		return record('InventoryReportingService.getInventoryMovements', async () => {
			// TODO: Inventory reporting needs proper product stock table structure
			throw new Error(
				'Inventory reporting not yet implemented - requires product stock table structure',
			)
		})
	}

	get routes() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const { Elysia } = require('elysia')
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		const { authPluginMacro } = require('@/core/http/auth-macro')
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		const { res } = require('@/core/http/response')
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		const { createSuccessResponseSchema } = require('@/core/validation')

		// eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
		return new Elysia({ prefix: '/inventory' })
			.use(authPluginMacro)
			.get(
				'/stock-levels',
				async ({ query }: { query: dto.InventoryReportRequestDto }) => {
					const result = await this.getStockLevels(query)
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
					const result = await this.getStockValue(query)
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
					const result = await this.getLowStockItems(query)
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
					const result = await this.getInventoryMovements(query)
					return res.ok(result)
				},
				{
					query: dto.InventoryReportRequestDto,
					response: createSuccessResponseSchema(dto.InventoryMovementChartResponseDto),
					auth: true,
				},
			)
	}
}

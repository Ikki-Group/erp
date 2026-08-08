import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import { StockBalanceFilterDto, StockBalanceQueryDto, StockMovementFilterDto } from './stock.contract.ts'

import type { StockService } from './stock.service.ts'

// ─── Route Factory ───

export function createStockRoute(service: StockService) {
	return new Elysia({ prefix: '/stock' })
		.use(authPluginMacro)

		.get(
			'/balance',
			async ({ query }) => {
				const result = await service.handleGetBalance(query)
				return res.ok(result)
			},
			{ query: StockBalanceQueryDto },
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleGetBalances(query)
				return res.paginated(result)
			},
			{ query: StockBalanceFilterDto },
		)
		.get(
			'/movements',
			async ({ query }) => {
				const result = await service.handleGetMovements(query)
				return res.paginated(result)
			},
			{ query: StockMovementFilterDto },
		)
}

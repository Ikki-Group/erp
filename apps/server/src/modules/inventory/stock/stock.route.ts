import { zRes } from '@ikki/contract/http'
import {
	StockBalanceDto,
	StockBalanceFilterDto,
	StockBalanceQueryDto,
	StockMovementDto,
	StockMovementFilterDto,
} from '@ikki/contract/inventory/stock'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import type { StockService } from './stock.service.ts'

// ─── Route Factory ───

export function createStockRoute(service: StockService) {
	return new Elysia({ prefix: '/stock' })
		.use(authGuard)

		.get(
			'/balance',
			async ({ query }) => {
				const result = await service.handleGetBalance(query)
				return res.ok(result)
			},
			{ query: StockBalanceQueryDto, response: zRes.ok(StockBalanceDto), permission: 'stock.read' },
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleGetBalances(query)
				return res.paginated(result)
			},
			{
				query: StockBalanceFilterDto,
				response: zRes.paginated(StockBalanceDto),
				permission: 'stock.read',
			},
		)
		.get(
			'/movements',
			async ({ query }) => {
				const result = await service.handleGetMovements(query)
				return res.paginated(result)
			},
			{
				query: StockMovementFilterDto,
				response: zRes.paginated(StockMovementDto),
				permission: 'stock.read',
			},
		)
}

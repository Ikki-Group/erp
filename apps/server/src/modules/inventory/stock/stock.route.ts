import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'

import {
	StockBalanceDto,
	StockBalanceFilterDto,
	StockBalanceQueryDto,
	StockMovementCursorFilterDto,
	StockMovementDto,
	StockMovementFilterDto,
} from './stock.contract.ts'
import type { StockService } from './stock.service.ts'

// ─── Route Factory ───

export function createStockRoute(service: StockService) {
	return new Elysia({ prefix: '/stock', tags: ['Stock'] })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/balance',
			async ({ query }) => {
				const result = await service.handleGetBalance(query)
				return res.ok(result)
			},
			{
				query: StockBalanceQueryDto,
				response: zRes.ok(StockBalanceDto),
				permission: 'stock.read',
				detail: { summary: 'Get stock balance for a material at a location' },
			},
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
				detail: { summary: 'List stock balances (offset)' },
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
				detail: {
					summary: 'List stock movements (offset)',
					description:
						'Page-number pagination. For large or continuously growing ledgers prefer the cursor variant, which stays stable while new movements are posted.',
				},
			},
		)
		.get(
			'/movements/cursor',
			async ({ query }) => {
				const result = await service.handleGetMovementsByCursor(query)
				return res.cursorPaginated(result)
			},
			{
				query: StockMovementCursorFilterDto,
				response: zRes.cursorPaginated(StockMovementDto),
				permission: 'stock.read',
				detail: {
					summary: 'List stock movements (cursor)',
					description:
						'Keyset pagination ordered by `createdAt` then `id`, newest first. Same filters as the offset variant; pass the returned cursor to fetch the next page.',
				},
			},
		)
}

import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zp } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import { StockAlertCountFilterDto, StockAlertFilterDto, StockAlertSelectDto } from './stock-alert.contract'
import type { StockAlertModule } from './stock-alert.module'

export function createStockAlertRoute(m: StockAlertModule) {
	return new Elysia({ prefix: '/alert' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleAlerts(query)
				return res.paginated(result)
			},
			{
				query: StockAlertFilterDto,
				response: createPaginatedResponseDto(StockAlertSelectDto),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
		.get(
			'/count',
			async ({ query }) => {
				const result = await m.handleCount(query)
				return res.ok(result)
			},
			{
				query: StockAlertCountFilterDto,
				response: createSuccessResponseDto(z.object({ count: zp.num })),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
}

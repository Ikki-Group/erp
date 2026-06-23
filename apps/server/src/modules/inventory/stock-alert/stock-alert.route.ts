import { z } from 'zod'
import { zq } from '@/shared/schema'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { StockAlertFilterDto, StockAlertSelectDto } from './stock-alert.contract'
import type { StockAlertService } from './stock-alert.service'

export function initStockAlertRoute(s: StockAlertService) {
	return new Elysia({ prefix: '/alert' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.handleAlerts(query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...StockAlertFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseSchema(StockAlertSelectDto),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
		.get(
			'/count',
			async function count({ query }) {
				const result = await s.handleCount(query)
				return res.ok(result)
			},
			{
				query: StockAlertFilterDto,
				response: createSuccessResponseSchema(z.object({ count: z.number() })),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
}

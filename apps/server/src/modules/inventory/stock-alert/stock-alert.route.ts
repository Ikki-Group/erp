import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zq } from '@/core/validation'

import { StockAlertFilterDto, StockAlertSelectDto } from './stock-alert.dto'
import type { StockAlertService } from './stock-alert.service'

export function initStockAlertRoute(s: StockAlertService) {
	return new Elysia({ prefix: '/alert' })
		.use(authPluginMacro)
		.get(
			'/list',
			// @ts-expect-error
			async function list({ query }) {
				const result = await s.handleAlerts(query)
				return res.paginated(result)
			},
			{
				query: StockAlertFilterDto.extend(zq.pagination.shape),
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

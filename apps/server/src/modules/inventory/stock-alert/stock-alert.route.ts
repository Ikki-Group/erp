import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zp } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import { StockAlertFilterDto, StockAlertCountFilterDto, StockAlertSelectDto } from './stock-alert.contract'
import type { StockAlertService } from './stock-alert.service'

export function initStockAlertRoute(s: StockAlertService) {
	return new Elysia({ prefix: '/alert' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await s.handleAlerts(context.query)
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
			async function count(context) {
				const result = await s.handleCount(context.query)
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

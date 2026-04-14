import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
} from '@/core/validation'

import { stockAlertFilterSchema, stockAlertSelectSchema } from '../dto'
import type { InventoryServiceModule } from '../service'
import z from 'zod'

export function initStockAlertRoute(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/alert' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.alert.handleAlerts(query, query)
				return res.paginated(result)
			},
			{
				query: stockAlertFilterSchema.extend(zPaginationDto.shape),
				response: createPaginatedResponseSchema(stockAlertSelectSchema),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
		.get(
			'/count',
			async function count({ query }) {
				const result = await s.alert.handleCount(query)
				return res.ok(result)
			},
			{
				query: stockAlertFilterSchema,
				response: createSuccessResponseSchema(z.object({ count: z.number() })),
				auth: true,
				detail: { tags: ['Inventory Alert'] },
			},
		)
}

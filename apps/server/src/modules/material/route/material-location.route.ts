import {
	z,
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'

import {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
} from '../dto/material-location.dto'
import type { MaterialLocationService } from '../service/material-location.service'

export function initMaterialLocationRoute(s: MaterialLocationService) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.post('/assign', async ({ body, auth }) => res.ok(await s.assign(body, auth.userId)), {
			body: MaterialLocationAssignDto,
			response: createSuccessResponseSchema(z.object({ assignedCount: z.number() })),
			auth: true,
		})
		.delete('/unassign', async ({ query }) => res.ok(await s.unassign(query)), {
			query: MaterialLocationUnassignDto,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.get('/by-material', async ({ query }) => res.ok(await s.locationsByMaterial(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(z.any()),
			auth: true,
		})
		.get('/stock', async ({ query }) => res.paginated(await s.stockByLocation(query)), {
			query: MaterialLocationFilterDto,
			response: createPaginatedResponseSchema(MaterialLocationStockDto),
			auth: true,
		})
		.put(
			'/config',
			async ({ body, auth }) => {
				const data = {
					id: body.id,
					minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
					maxStock:
						body.maxStock !== undefined
							? body.maxStock !== null
								? Number(body.maxStock)
								: null
							: undefined,
					reorderPoint: body.reorderPoint !== undefined ? Number(body.reorderPoint) : undefined,
				}
				return res.ok(await s.updateConfig(data, auth.userId))
			},
			{
				body: MaterialLocationConfigDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}

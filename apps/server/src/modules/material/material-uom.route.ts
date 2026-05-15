import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/shared/validation'

import {
	MaterialUomFilterSchema,
	MaterialUomMutationSchema,
	MaterialUomSchema,
} from './material-uom.schema'
import type { MaterialUomService } from './material-uom.service'

export function initMaterialUomRoute(svc: MaterialUomService) {
	return new Elysia({ prefix: '/uom' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: MaterialUomFilterSchema,
			response: createPaginatedResponseSchema(MaterialUomSchema),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(MaterialUomSchema),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await svc.handleCreate(body, auth.userId)),
			{
				body: MaterialUomMutationSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await svc.handleUpdate(body.id, body, auth.userId)),
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialUomMutationSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete('/remove', async ({ query }) => res.ok(await svc.handleRemove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
}

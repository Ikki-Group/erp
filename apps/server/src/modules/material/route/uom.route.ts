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

import { UomDto, UomFilterDto, UomMutationDto } from '../dto/uom.dto'
import type { UomService } from '../service/uom.service'

export function initMaterialUomRoute(s: UomService) {
	return new Elysia({ prefix: '/uom' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: UomFilterDto,
			response: createPaginatedResponseSchema(UomDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(UomDto),
			auth: true,
		})
		.post('/create', async ({ body, auth }) => res.created(await s.create(body, auth.userId)), {
			body: UomMutationDto,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.put('/update', async ({ body, auth }) => res.ok(await s.update(body.id, body, auth.userId)), {
			body: z.object({ ...zc.RecordId.shape, ...UomMutationDto.shape }),
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
		.delete('/remove', async ({ query }) => res.ok(await s.remove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(zc.RecordId),
			auth: true,
		})
}

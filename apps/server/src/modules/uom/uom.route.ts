import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import { UomDto, UomFilterDto, UomCreateDto, UomUpdateDto } from './uom.contract'
import type { UomService } from './uom.service'

export function createUomRoute(service: UomService) {
	return new Elysia({ prefix: '/uom' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
			query: UomFilterDto,
			response: createPaginatedResponseDto(UomDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await service.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(UomDto),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await service.handleCreate(body, auth.userId)),
			{
				body: UomCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, auth.userId)),
			{
				body: UomUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete('/remove', async ({ query }) => res.ok(await service.handleDelete(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
}

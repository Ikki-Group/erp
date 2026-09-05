import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	ConvertRequestDto,
	ConvertResponseDto,
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from './uom.contract.ts'
import type { UomService } from './uom.service.ts'

export function createUomRoute(service: UomService) {
	return new Elysia({ prefix: '/uom', tags: ['uom'] })
		.use(rbac.as('scoped'))
		.get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
			query: UomFilterDto,
			response: zRes.paginated(UomDto),
			permission: 'uom.read',
		})
		.get('/detail', async ({ query }) => res.ok(await service.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(UomDto),
			permission: 'uom.read',
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await service.handleCreate(body, auth.userId)),
			{
				body: UomCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'uom.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, auth.userId)),
			{
				body: UomUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.delete',
			},
		)
		.get('/conversion/list', async () => res.ok(await service.handleConversionList()), {
			response: zRes.ok(z.array(UomConversionDto)),
			permission: 'uom.read',
		})
		.post(
			'/conversion/create',
			async ({ body, auth }) =>
				res.created(await service.handleConversionCreate(body, auth.userId)),
			{
				body: UomConversionCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'uom.create',
			},
		)
		.delete(
			'/conversion/remove',
			async ({ query, auth }) =>
				res.ok(await service.handleConversionRemove(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.delete',
			},
		)
		.post('/convert', async ({ body }) => res.ok(await service.handleConvert(body)), {
			body: ConvertRequestDto,
			response: zRes.ok(ConvertResponseDto),
			permission: 'uom.read',
		})
}

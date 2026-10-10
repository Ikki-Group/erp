import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@ikki/contract/http'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@ikki/contract/schema'

import {
	ConvertRequestDto,
	ConvertResponseDto,
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from '@ikki/contract/uom'
import type { UomService } from './uom.service.ts'

export function createUomRoute(service: UomService) {
	return new Elysia({ prefix: '/uom', tags: ['uom'] })
		.use(authGuard)
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
			async ({ body, auth }) => res.ok(await service.handleCreate(body, actorOf(auth))),
			{
				body: UomCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, actorOf(auth))),
			{
				body: UomUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, actorOf(auth))),
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
			async ({ body, auth }) => res.ok(await service.handleConversionCreate(body, actorOf(auth))),
			{
				body: UomConversionCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.create',
			},
		)
		.delete(
			'/conversion/remove',
			async ({ query, auth }) =>
				res.ok(await service.handleConversionRemove(query.id, actorOf(auth))),
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

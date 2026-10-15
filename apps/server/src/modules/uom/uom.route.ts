import { z } from 'zod'

import { crudRoutes } from '@/server/crud-route.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
	return crudRoutes({
		prefix: '/uom',
		resource: 'uom',
		service,
		schemas: { filter: UomFilterDto, dto: UomDto, create: UomCreateDto, update: UomUpdateDto },
	})
		.get('/conversion/list', async () => res.ok(await service.handleConversionList()), {
			response: zRes.ok(z.array(UomConversionDto)),
			permission: 'uom.read',
		})
		.post(
			'/conversion/create',
			async ({ body, auth }) =>
				res.created(await service.handleConversionCreate(body, actorOf(auth))),
			{
				body: UomConversionCreateDto,
				response: zRes.created(EntityRefDto),
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

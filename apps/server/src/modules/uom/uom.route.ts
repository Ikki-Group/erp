import { z } from 'zod'

import { crudRoutes } from '@/server/crud-route.ts'
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
		tag: 'Units of Measure',
		entity: 'unit of measure',
		service,
		schemas: { filter: UomFilterDto, dto: UomDto, create: UomCreateDto, update: UomUpdateDto },
	})
		.get('/conversion/list', async () => res.ok(await service.handleConversionList()), {
			response: zRes.ok(z.array(UomConversionDto)),
			permission: 'uom.read',
			detail: { tags: ['UoM Conversions'], summary: 'List unit conversions' },
		})
		.post(
			'/conversion/create',
			async ({ body, actor }) => res.created(await service.handleConversionCreate(body, actor)),
			{
				body: UomConversionCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'uom.create',
				detail: {
					tags: ['UoM Conversions'],
					summary: 'Create a unit conversion',
					description: 'Both units must exist and share the same category.',
				},
			},
		)
		.delete(
			'/conversion/remove',
			async ({ query, actor }) => res.ok(await service.handleConversionRemove(query.id, actor)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'uom.delete',
				detail: { tags: ['UoM Conversions'], summary: 'Delete a unit conversion' },
			},
		)
		.post('/convert', async ({ body }) => res.ok(await service.handleConvert(body)), {
			body: ConvertRequestDto,
			response: zRes.ok(ConvertResponseDto),
			permission: 'uom.read',
			detail: {
				tags: ['UoM Conversions'],
				summary: 'Convert a quantity between units',
				description:
					'Read-only. Units must share a category; resolves a path through defined conversions and fails if none exists.',
			},
		})
}

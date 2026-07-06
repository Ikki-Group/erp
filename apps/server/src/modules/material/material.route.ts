import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
} from './category/category.contract'
import type { MaterialCategoryService } from './category/category.service'
import {
	MaterialConversionCreateDto,
	MaterialConversionDto,
	MaterialConversionFilterDto,
	MaterialConversionUpdateDto,
} from './conversion/conversion.contract'
import type { MaterialConversionService } from './conversion/conversion.service'
import {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
} from './location/location.contract'
import type { MaterialLocationService } from './location/location.service'
import { MaterialCreateDto } from './material.contract'
import type { MaterialModule } from './material.module'
import type { MaterialService } from './material.service'
import { MaterialQueryFilterDto } from './query/query.contract'
import type { MaterialQueryService } from './query/query.service'

/* -------------------------------------------------------------------------- */
/*                                  CATEGORY                                  */
/* -------------------------------------------------------------------------- */

function categoryRoute(s: MaterialCategoryService) {
	return new Elysia({ prefix: '/category' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialCategoryFilterDto,
			response: createPaginatedResponseDto(MaterialCategoryDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(MaterialCategoryDto),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await s.handleCreate(body, auth.userId)),
			{
				body: MaterialCategoryMutationDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await s.handleUpdate(body.id, body, auth.userId)),
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialCategoryMutationDto.shape }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete('/remove', async ({ query }) => res.ok(await s.handleRemove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
}

/* -------------------------------------------------------------------------- */
/*                                 CONVERSION                                 */
/* -------------------------------------------------------------------------- */

function conversionRoute(s: MaterialConversionService) {
	return new Elysia({ prefix: '/conversion' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialConversionFilterDto,
			response: createPaginatedResponseDto(MaterialConversionDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(MaterialConversionDto),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await s.handleCreate(body, auth.userId)),
			{
				body: MaterialConversionCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put('/update', async ({ body, auth }) => res.ok(await s.handleUpdate(body, auth.userId)), {
			body: MaterialConversionUpdateDto,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
		.delete('/remove', async ({ query }) => res.ok(await s.handleRemove(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
}

/* -------------------------------------------------------------------------- */
/*                                  LOCATION                                  */
/* -------------------------------------------------------------------------- */

function locationRoute(s: MaterialLocationService) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.post('/assign', async ({ body, auth }) => res.ok(await s.assign(body, auth.userId)), {
			body: MaterialLocationAssignDto,
			response: createSuccessResponseDto(z.object({ assignedCount: z.number() })),
			auth: true,
		})
		.delete('/unassign', async ({ query }) => res.ok(await s.unassign(query)), {
			query: MaterialLocationUnassignDto,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
		.get('/by-material', async ({ query }) => res.ok(await s.locationsByMaterial(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(z.any()),
			auth: true,
		})
		.get('/stock', async ({ query }) => res.paginated(await s.stockByLocation(query)), {
			query: MaterialLocationFilterDto,
			response: createPaginatedResponseDto(MaterialLocationStockDto),
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
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

/* -------------------------------------------------------------------------- */
/*                                    QUERY                                   */
/* -------------------------------------------------------------------------- */

function queryRoute(s: MaterialQueryService) {
	return new Elysia()
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await s.list(query)), {
			query: MaterialQueryFilterDto,
			response: createPaginatedResponseDto(z.any()),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await s.detail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseDto(z.any()),
			auth: true,
		})
}

/* -------------------------------------------------------------------------- */
/*                                   MASTER                                   */
/* -------------------------------------------------------------------------- */

function masterRoute(s: MaterialService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/create',
			async function create(context) {
				const { id } = await s.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: MaterialCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await s.handleUpdate(context.body.id, context.body, context.auth.userId)
				return res.ok({ id })
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...MaterialCreateDto.shape }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				const { id } = await s.handleRemove(context.query.id)
				return res.ok({ id })
			},
			{
				query: z.object({ id: z.coerce.number().int().positive() }),
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

/* -------------------------------------------------------------------------- */
/*                                  AGGREGATE                                 */
/* -------------------------------------------------------------------------- */

export function initMaterialRoutes(m: MaterialModule) {
	return new Elysia({ prefix: '/material' })
		.use(categoryRoute(m.category))
		.use(conversionRoute(m.conversion))
		.use(locationRoute(m.location))
		.use(queryRoute(m.query))
		.use(masterRoute(m.master))
}

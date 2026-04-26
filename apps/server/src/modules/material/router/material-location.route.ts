import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
	MaterialLocationWithLocationDto,
} from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialLocationRoute(s: MaterialServiceModule) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.post(
			'/assign',
			async function assign({ body, auth }) {
				const result = await s.mLocation.handleAssign(body, auth.userId)
				return res.ok(result)
			},
			{
				body: MaterialLocationAssignDto,
				response: createSuccessResponseSchema(z.object({ assignedCount: z.number() })),
				auth: true,
				detail: { tags: ['Material Location'] },
			},
		)
		.delete(
			'/unassign',
			async function unassign({ query }) {
				const result = await s.mLocation.handleUnassign(query)
				return res.ok(result)
			},
			{
				query: MaterialLocationUnassignDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
				detail: { tags: ['Material Location'] },
			},
		)
		.get(
			'/by-material',
			async function byMaterial({ query }) {
				const data = await s.mLocation.handleLocationsByMaterial(query.id)
				return res.ok(data)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseSchema(MaterialLocationWithLocationDto.array()),
				auth: true,
				detail: { tags: ['Material Location'] },
			},
		)
		.get(
			'/stock',
			async function stock({ query }) {
				const result = await s.mLocation.handleStockByLocation(query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...MaterialLocationFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseSchema(MaterialLocationStockDto),
				auth: true,
				detail: { tags: ['Material Location'] },
			},
		)
		.put(
			'/config',
			async function config({ body, auth }) {
				const result = await s.mLocation.handleUpdateConfig(body, auth.userId)
				return res.ok(result)
			},
			{
				body: MaterialLocationConfigDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
				detail: { tags: ['Material Location'] },
			},
		)
}

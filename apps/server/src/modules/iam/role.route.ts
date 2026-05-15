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

import { RoleFilterSchema, RoleMutationSchema, RoleSchema } from './role.schema'
import type { RoleService } from './role.service'

export function createRoleRoute(svc: RoleService) {
	return new Elysia({ prefix: '/role' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: RoleFilterSchema,
			response: createPaginatedResponseSchema(RoleSchema),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(RoleSchema),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await svc.handleCreate(body, auth.userId)),
			{
				body: RoleMutationSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await svc.handleUpdate(body.id, body, auth.userId)),
			{
				body: z.object({ ...zc.RecordId.shape, ...RoleMutationSchema.shape }),
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

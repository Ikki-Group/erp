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
	UserFilterSchema,
	UserCreateSchema,
	UserUpdateSchema,
	UserChangePasswordSchema,
	UserAdminUpdatePasswordSchema,
} from './user.schema'
import type { UserService } from './user.service'

export function createUserRoute(svc: UserService) {
	return new Elysia({ prefix: '/user' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await svc.handleList(query)), {
			query: UserFilterSchema,
			response: createPaginatedResponseSchema(z.any()),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await svc.handleDetail(query.id)), {
			query: zq.recordId,
			response: createSuccessResponseSchema(z.any()),
			auth: true,
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await svc.handleCreate(body, auth.userId)),
			{
				body: UserCreateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await svc.handleUpdate(body.id, body, auth.userId)),
			{
				body: z.object({ ...zc.RecordId.shape, ...UserUpdateSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/change-password',
			async ({ body, auth }) =>
				res.ok(await svc.handleChangePassword(auth.userId, body, auth.userId)),
			{
				body: UserChangePasswordSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/admin/password-reset',
			async ({ body, auth }) => res.ok(await svc.handleAdminUpdatePassword(body, auth.userId)),
			{
				body: UserAdminUpdatePasswordSchema,
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

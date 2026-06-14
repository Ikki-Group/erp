import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/shared/schema'

import * as composedSchema from './composed/composed.schema'
import type { IamService } from './iam.service'
import * as roleSchema from './role/role.schema'
import * as userSchema from './user/user.contract'

function roleRoute(svc: IamService) {
	return new Elysia({ prefix: '/role' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await svc.role.handleList(query)
				return res.paginated(result)
			},
			{
				query: roleSchema.RoleFilterSchema,
				response: createPaginatedResponseSchema(roleSchema.RoleSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await svc.role.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(roleSchema.RoleSchema),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await svc.role.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: roleSchema.RoleMutationSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const { id, ...data } = body
				const result = await svc.role.handleUpdate(id, data, auth.userId)
				return res.ok(result)
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...roleSchema.RoleMutationSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await svc.role.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}

function userRoute(svc: IamService) {
	return new Elysia({ prefix: '/user' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await svc.composed.getListPaginated(query)
				return res.paginated(result)
			},
			{
				query: composedSchema.UserFilterSchema,
				response: createPaginatedResponseSchema(composedSchema.UserDetailSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await svc.composed.getDetailById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(composedSchema.UserDetailSchema),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await svc.user.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: userSchema.UserCreateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await svc.user.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: z.object({ ...zc.RecordId.shape, ...userSchema.UserUpdateSchema.shape }),
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/change-password',
			async ({ body, auth }) => {
				const result = await svc.user.handleChangePassword(auth.userId, body, auth.userId)
				return res.ok(result)
			},
			{
				body: userSchema.UserChangePasswordSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/admin/password-reset',
			async ({ body, auth }) => {
				const result = await svc.user.handleAdminUpdatePassword(body, auth.userId)
				return res.ok(result)
			},
			{
				body: userSchema.UserAdminUpdatePasswordSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await svc.user.handleRemove(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}

export function createIamRoute(svc: IamService) {
	return new Elysia({ prefix: '/iam' }).use(authPluginMacro).use(roleRoute(svc)).use(userRoute(svc))
}

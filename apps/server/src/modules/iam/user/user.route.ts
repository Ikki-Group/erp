import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/core/validation'

import * as dto from './user.dto'
import type { UserService } from './user.service'

export function initUserRoute(service: UserService) {
	return new Elysia({ prefix: '/user' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.UserFilterDto,
				response: createPaginatedResponseSchema(dto.UserDetailDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.UserDetailResolvedDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{ body: dto.UserCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body.id, body, auth.userId)
				return res.ok(result)
			},
			{ body: dto.UserUpdateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/change-password',
			async function changePassword({ body, auth }) {
				const result = await service.handleChangePassword(auth.userId, body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.UserChangePasswordDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/admin/password-reset',
			async function adminUpdatePassword({ body, auth }) {
				const result = await service.handleAdminUpdatePassword(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.UserAdminUpdatePasswordDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				const result = await service.handleRemove(body.id)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}

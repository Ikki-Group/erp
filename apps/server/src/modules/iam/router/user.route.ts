import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/core/validation'

import * as dto from '../dto/user.dto'
import type { UserService } from '../service/user.service'
import type { UserUsecases } from '../usecase/user.usecase'

/**
 * User Module Route (Layer 1)
 * Uses UserUsecases for cross-module operations (list/detail/create/update)
 * Uses UserService directly for single-domain operations (password/remove)
 */
export function initUserRoute(service: UserService, usecase: UserUsecases) {
	return new Elysia({ prefix: '/user' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await usecase.handleList(query)
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
				const result = await usecase.handleDetail(query.id)
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
				const result = await usecase.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{ body: dto.UserCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const result = await usecase.handleUpdate(body.id, body, auth.userId)
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

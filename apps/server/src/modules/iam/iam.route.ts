import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import { UserDetailDto, UserFilterDto } from './composed/composed.contract'
import type { IamModule } from './iam.module'
import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role/role.contract'
import {
	UserAdminUpdatePasswordDto,
	UserChangePasswordDto,
	UserCreateDto,
	UserUpdateDto,
} from './user/user.contract'

function roleRoute(svc: IamModule) {
	return new Elysia({ prefix: '/role' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await svc.role.handleList(query)
				return res.paginated(result)
			},
			{
				query: RoleFilterDto,
				response: createPaginatedResponseDto(RoleDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await svc.role.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(RoleDto),
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
				body: RoleCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await svc.role.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: RoleUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await svc.role.handleDelete(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

function userRoute(svc: IamModule) {
	return new Elysia({ prefix: '/user' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await svc.composed.getListPaginated(query)
				return res.paginated(result)
			},
			{
				query: UserFilterDto,
				response: createPaginatedResponseDto(UserDetailDto),
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
				response: createSuccessResponseDto(UserDetailDto),
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
				body: UserCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
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
				body: UserUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
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
				body: UserChangePasswordDto,
				response: createSuccessResponseDto(zc.RecordId),
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
				body: UserAdminUpdatePasswordDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query }) => {
				const result = await svc.user.handleDelete(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}

export function createIamRoute(svc: IamModule) {
	return new Elysia({ prefix: '/iam' }).use(authPluginMacro).use(roleRoute(svc)).use(userRoute(svc))
}

import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
} from './assignment/assignment.contract.ts'
import type { AssignmentService } from './assignment/assignment.service.ts'
import {
	ComposedUserFilterDto,
	UserDetailDto,
	UserListItemDto,
} from './composed/composed.contract.ts'
import type { ComposedService } from './composed/composed.service.ts'
import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role/role.contract.ts'
import type { RoleService } from './role/role.service.ts'
import { UserCreateDto, UserUpdateDto } from './user/user.contract.ts'
import type { UserService } from './user/user.service.ts'

export function createIamRoute(
	roleService: RoleService,
	userService: UserService,
	assignmentService: AssignmentService,
	composedService: ComposedService,
) {
	return new Elysia({ prefix: '/iam', tags: ['iam'] })
		.use(rbac.as('scoped'))
		.get('/role/list', async ({ query }) => res.paginated(await roleService.handleList(query)), {
			query: RoleFilterDto,
			response: zRes.paginated(RoleDto),
			permission: 'iam.read',
		})
		.get('/role/detail', async ({ query }) => res.ok(await roleService.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(RoleDto),
			permission: 'iam.read',
		})
		.post(
			'/role/create',
			async ({ body, auth }) => res.created(await roleService.handleCreate(body, auth.userId)),
			{
				body: RoleCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/role/update',
			async ({ body, auth }) => res.ok(await roleService.handleUpdate(body, auth.userId)),
			{
				body: RoleUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/role/remove',
			async ({ query, auth }) => res.ok(await roleService.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
		.get(
			'/user/list',
			async ({ query }) => res.paginated(await composedService.handleUserList(query)),
			{
				query: ComposedUserFilterDto,
				response: zRes.paginated(UserListItemDto),
				permission: 'iam.read',
			},
		)
		.get(
			'/user/detail',
			async ({ query }) => res.ok(await composedService.handleUserDetail(query.id)),
			{
				query: zq.recordId,
				response: zRes.ok(UserDetailDto),
				permission: 'iam.read',
			},
		)
		.post(
			'/user/create',
			async ({ body, auth }) => res.created(await userService.handleCreate(body, auth.userId)),
			{
				body: UserCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/user/update',
			async ({ body, auth }) => res.ok(await userService.handleUpdate(body, auth.userId)),
			{
				body: UserUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/user/deactivate',
			async ({ query, auth }) => res.ok(await userService.handleDeactivate(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
		.get(
			'/assignment/list',
			async ({ query }) => res.paginated(await assignmentService.handleList(query)),
			{
				query: AssignmentFilterDto,
				response: zRes.paginated(AssignmentDto),
				permission: 'iam.read',
			},
		)
		.post(
			'/assignment/assign',
			async ({ body, auth }) =>
				res.created(await assignmentService.handleAssign(body, auth.userId)),
			{
				body: AssignmentCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.delete(
			'/assignment/remove',
			async ({ body, auth }) => res.ok(await assignmentService.handleRemove(body, auth.userId)),
			{
				body: AssignmentRemoveDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
}

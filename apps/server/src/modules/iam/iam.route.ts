import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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

// ─── Route Factory ───

export function createIamRoute(
	roleService: RoleService,
	userService: UserService,
	assignmentService: AssignmentService,
	composedService: ComposedService,
) {
	return (
		new Elysia({ prefix: '/iam' })
			.use(authPluginMacro)

			// ─── Role Routes ───

			.get(
				'/role/list',
				async ({ query }) => {
					const result = await roleService.handleList(query)
					return res.paginated(result)
				},
				{ query: RoleFilterDto, response: zRes.paginated(RoleDto) },
			)
			.get(
				'/role/detail',
				async ({ query }) => {
					const result = await roleService.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(RoleDto) },
			)
			.post(
				'/role/create',
				async ({ body, auth }) => {
					const result = await roleService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: RoleCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/role/update',
				async ({ body, auth }) => {
					const result = await roleService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: RoleUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/role/remove',
				async ({ query, auth }) => {
					const result = await roleService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── User Routes ───

			.get(
				'/user/list',
				async ({ query }) => {
					const result = await composedService.handleUserList(query)
					return res.paginated(result)
				},
				{ query: ComposedUserFilterDto, response: zRes.paginated(UserListItemDto) },
			)
			.get(
				'/user/detail',
				async ({ query }) => {
					const result = await composedService.handleUserDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(UserDetailDto) },
			)
			.post(
				'/user/create',
				async ({ body, auth }) => {
					const result = await userService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: UserCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/user/update',
				async ({ body, auth }) => {
					const result = await userService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: UserUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/user/deactivate',
				async ({ query, auth }) => {
					const result = await userService.handleDeactivate(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Assignment Routes ───

			.get(
				'/assignment/list',
				async ({ query }) => {
					const result = await assignmentService.handleList(query)
					return res.paginated(result)
				},
				{ query: AssignmentFilterDto, response: zRes.paginated(AssignmentDto) },
			)
			.post(
				'/assignment/assign',
				async ({ body, auth }) => {
					const result = await assignmentService.handleAssign(body, auth.userId)
					return res.created(result)
				},
				{ body: AssignmentCreateDto, response: zRes.created(EntityRefDto) },
			)
			.delete(
				'/assignment/remove',
				async ({ body, auth }) => {
					const result = await assignmentService.handleRemove(body, auth.userId)
					return res.ok(result)
				},
				{ body: AssignmentRemoveDto, response: zRes.ok(EntityRefDto) },
			)
	)
}

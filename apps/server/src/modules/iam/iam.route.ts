import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { BadRequestError } from '@/shared/errors/http-error.ts'
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
	LocationStaffListItemDto,
	UserDetailDto,
	UserListItemDto,
} from './composed/composed.contract.ts'
import type { ComposedService } from './composed/composed.service.ts'
import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from './role/role.contract.ts'
import type { RoleService } from './role/role.service.ts'
import { UserCreateDto, UserResetPasswordDto, UserUpdateDto } from './user/user.contract.ts'
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
			async ({ body, actor }) => res.created(await roleService.handleCreate(body, actor)),
			{
				body: RoleCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/role/update',
			async ({ body, actor }) => res.ok(await roleService.handleUpdate(body, actor)),
			{
				body: RoleUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/role/remove',
			async ({ query, actor }) => res.ok(await roleService.handleDelete(query.id, actor)),
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
			'/user/location-staff/list',
			async ({ query, actor }) => {
				if (actor.locationId === null) {
					throw new BadRequestError('An active location is required', {
						code: 'ACTIVE_LOCATION_REQUIRED',
					})
				}
				return res.paginated(await composedService.handleLocationStaffList(query, actor.locationId))
			},
			{
				query: ComposedUserFilterDto,
				response: zRes.paginated(LocationStaffListItemDto),
				permission: 'location-staff.read',
			},
		)
		.get(
			'/user/by-location',
			async ({ query }) =>
				res.paginated(await composedService.handleLocationStaffList(query, query.locationId)),
			{
				query: ComposedUserFilterDto.extend({ locationId: z.coerce.number().int().positive() }),
				response: zRes.paginated(LocationStaffListItemDto),
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
			async ({ body, actor }) => res.created(await userService.handleCreate(body, actor)),
			{
				body: UserCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/user/update',
			async ({ body, actor }) => res.ok(await userService.handleUpdate(body, actor)),
			{
				body: UserUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/user/deactivate',
			async ({ query, actor }) => res.ok(await userService.handleDeactivate(query.id, actor)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
		.put(
			'/user/reset-password',
			async ({ body, actor }) => res.ok(await userService.handleResetPassword(body, actor)),
			{
				body: UserResetPasswordDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
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
			async ({ body, actor }) => res.created(await assignmentService.handleAssign(body, actor)),
			{
				body: AssignmentCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.delete(
			'/assignment/remove',
			async ({ body, actor }) => res.ok(await assignmentService.handleRemove(body, actor)),
			{
				body: AssignmentRemoveDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
}

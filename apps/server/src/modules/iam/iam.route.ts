import { zRes } from '@ikki/contract/http'
import {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
} from '@ikki/contract/iam/assignment'
import {
	ComposedUserFilterDto,
	LocationStaffListItemDto,
	UserDetailDto,
	UserListItemDto,
} from '@ikki/contract/iam/composed'
import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '@ikki/contract/iam/role'
import { UserCreateDto, UserResetPasswordDto, UserUpdateDto } from '@ikki/contract/iam/user'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { BadRequestError } from '@/shared/errors/http-error.ts'
import { res } from '@/shared/http/response.ts'

import type { AssignmentService } from './assignment/assignment.service.ts'
import type { ComposedService } from './composed/composed.service.ts'
import type { RoleService } from './role/role.service.ts'
import type { UserService } from './user/user.service.ts'

export function createIamRoute(
	roleService: RoleService,
	userService: UserService,
	assignmentService: AssignmentService,
	composedService: ComposedService,
) {
	return new Elysia({ prefix: '/iam', tags: ['iam'] })
		.use(authGuard)
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
			async ({ body, auth }) => res.ok(await roleService.handleCreate(body, actorOf(auth))),
			{
				body: RoleCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/role/update',
			async ({ body, auth }) => res.ok(await roleService.handleUpdate(body, actorOf(auth))),
			{
				body: RoleUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/role/remove',
			async ({ query, auth }) => res.ok(await roleService.handleDelete(query.id, actorOf(auth))),
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
			async ({ query, auth }) => {
				if (auth.locationId === null) {
					throw new BadRequestError('An active location is required', {
						code: 'ACTIVE_LOCATION_REQUIRED',
					})
				}
				return res.paginated(await composedService.handleLocationStaffList(query, auth.locationId))
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
			async ({ body, auth }) => res.ok(await userService.handleCreate(body, actorOf(auth))),
			{
				body: UserCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.put(
			'/user/update',
			async ({ body, auth }) => res.ok(await userService.handleUpdate(body, actorOf(auth))),
			{
				body: UserUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
			},
		)
		.delete(
			'/user/deactivate',
			async ({ query, auth }) =>
				res.ok(await userService.handleDeactivate(query.id, actorOf(auth))),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
		.put(
			'/user/reset-password',
			async ({ body, auth }) => res.ok(await userService.handleResetPassword(body, actorOf(auth))),
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
			async ({ body, auth }) => res.ok(await assignmentService.handleAssign(body, actorOf(auth))),
			{
				body: AssignmentCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.create',
			},
		)
		.delete(
			'/assignment/remove',
			async ({ body, auth }) => res.ok(await assignmentService.handleRemove(body, actorOf(auth))),
			{
				body: AssignmentRemoveDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
			},
		)
}

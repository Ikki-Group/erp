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
	return new Elysia({ prefix: '/iam' })
		.use(rbac.as('scoped'))
		.get('/role/list', async ({ query }) => res.paginated(await roleService.handleList(query)), {
			query: RoleFilterDto,
			response: zRes.paginated(RoleDto),
			permission: 'iam.read',
			detail: {
				tags: ['Roles'],
				summary: 'List roles',
			},
		})
		.get('/role/detail', async ({ query }) => res.ok(await roleService.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(RoleDto),
			permission: 'iam.read',
			detail: {
				tags: ['Roles'],
				summary: 'Get a role',
			},
		})
		.post(
			'/role/create',
			async ({ body, actor }) => res.created(await roleService.handleCreate(body, actor)),
			{
				body: RoleCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
				detail: {
					tags: ['Roles'],
					summary: 'Create a role',
				},
			},
		)
		.put(
			'/role/update',
			async ({ body, actor }) => res.ok(await roleService.handleUpdate(body, actor)),
			{
				body: RoleUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
				detail: {
					tags: ['Roles'],
					summary: 'Update a role',
					description: 'System roles are immutable.',
				},
			},
		)
		.delete(
			'/role/remove',
			async ({ query, actor }) => res.ok(await roleService.handleDelete(query.id, actor)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
				detail: {
					tags: ['Roles'],
					summary: 'Delete a role',
					description: 'System roles and roles with assignments cannot be deleted.',
				},
			},
		)
		.get(
			'/user/list',
			async ({ query }) => res.paginated(await composedService.handleUserList(query)),
			{
				query: ComposedUserFilterDto,
				response: zRes.paginated(UserListItemDto),
				permission: 'iam.read',
				detail: {
					tags: ['Users'],
					summary: 'List users',
				},
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
				detail: {
					tags: ['Users'],
					summary: 'List staff at the active location',
					description:
						'Lists users assigned to the **active location** (`X-Location-ID`); 400 if none is active. For an explicit location use `/iam/user/by-location`.',
				},
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
				detail: {
					tags: ['Users'],
					summary: 'List staff at a location',
					description:
						'Lists users assigned to the location given by the required `locationId` query. Unlike `/iam/user/location-staff/list`, it ignores the active location.',
				},
			},
		)
		.get(
			'/user/detail',
			async ({ query }) => res.ok(await composedService.handleUserDetail(query.id)),
			{
				query: zq.recordId,
				response: zRes.ok(UserDetailDto),
				permission: 'iam.read',
				detail: {
					tags: ['Users'],
					summary: 'Get a user',
				},
			},
		)
		.post(
			'/user/create',
			async ({ body, actor }) => res.created(await userService.handleCreate(body, actor)),
			{
				body: UserCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
				detail: {
					tags: ['Users'],
					summary: 'Create a user',
				},
			},
		)
		.put(
			'/user/update',
			async ({ body, actor }) => res.ok(await userService.handleUpdate(body, actor)),
			{
				body: UserUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
				detail: {
					tags: ['Users'],
					summary: 'Update a user',
				},
			},
		)
		.delete(
			'/user/deactivate',
			async ({ query, actor }) => res.ok(await userService.handleDeactivate(query.id, actor)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
				detail: {
					tags: ['Users'],
					summary: 'Deactivate a user',
					description:
						'Sets the user inactive; the record is kept. Does not assign or remove roles.',
				},
			},
		)
		.put(
			'/user/reset-password',
			async ({ body, actor }) => res.ok(await userService.handleResetPassword(body, actor)),
			{
				body: UserResetPasswordDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.update',
				detail: {
					tags: ['Users'],
					summary: 'Reset a user password',
					description: 'Also signs the user out of every session.',
				},
			},
		)
		.get(
			'/assignment/list',
			async ({ query }) => res.paginated(await assignmentService.handleList(query)),
			{
				query: AssignmentFilterDto,
				response: zRes.paginated(AssignmentDto),
				permission: 'iam.read',
				detail: {
					tags: ['User Assignments'],
					summary: 'List role assignments',
				},
			},
		)
		.post(
			'/assignment/assign',
			async ({ body, actor }) => res.created(await assignmentService.handleAssign(body, actor)),
			{
				body: AssignmentCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'iam.create',
				detail: {
					tags: ['User Assignments'],
					summary: 'Assign a role to a user',
					description:
						'A user is either global or location-scoped, never both, and may hold one role per location. The owner role must be global.',
				},
			},
		)
		.delete(
			'/assignment/remove',
			async ({ body, actor }) => res.ok(await assignmentService.handleRemove(body, actor)),
			{
				body: AssignmentRemoveDto,
				response: zRes.ok(EntityRefDto),
				permission: 'iam.delete',
				detail: {
					tags: ['User Assignments'],
					summary: 'Remove a role assignment',
					description: 'The last owner assignment cannot be removed.',
				},
			},
		)
}

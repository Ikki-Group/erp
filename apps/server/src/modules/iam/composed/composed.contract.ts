import z from 'zod'

import { defineContract } from '@/shared/contract/define-contract'
import { zc, zq } from '@/shared/schema'

import { LocationDto } from '@/modules/location'

import { UserAssignmentDto } from '../assignment/assignment.contract'
import { RoleDto } from '../role/role.contract'
import {
	UserAdminUpdatePasswordDto,
	UserChangePasswordDto,
	UserCreateDto,
	UserDto,
	UserUpdateDto,
} from '../user/user.contract'

const UserAssignmentWithRelationsDto = z.object({
	...UserAssignmentDto.shape,
	role: RoleDto,
	location: LocationDto,
})

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(UserAssignmentWithRelationsDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zq.boolean.optional(),
	isRoot: zq.boolean.optional(),
	locationId: zq.id.optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

/* -------------------------------- CONTRACT -------------------------------- */

/**
 * User HTTP contract (lives here because the user endpoints return the composed
 * `UserDetailDto`). Merges DTOs from user/role/assignment/composed sources.
 */
export const userContract = defineContract({
	feature: 'iam',
	entity: 'user',
	prefix: '/iam/user',
	dtoSource: [
		'iam/user/user.contract.ts',
		'iam/role/role.contract.ts',
		'iam/assignment/assignment.contract.ts',
		'iam/composed/composed.contract.ts',
	],
	dtos: {
		UserDetailDto,
		UserFilterDto,
		UserCreateDto,
		UserUpdateDto,
		UserChangePasswordDto,
		UserAdminUpdatePasswordDto,
	},
	endpoints: {
		list: { get: '/list', query: UserFilterDto, ok: [UserDetailDto] },
		detail: { get: '/detail', query: zc.RecordId, ok: UserDetailDto },
		create: { post: '/create', body: UserCreateDto, ok: zc.RecordId },
		update: { put: '/update', body: UserUpdateDto, ok: zc.RecordId },
		changePassword: {
			post: '/change-password',
			body: UserChangePasswordDto,
			ok: zc.RecordId,
		},
		adminPasswordReset: {
			post: '/admin/password-reset',
			body: UserAdminUpdatePasswordDto,
			ok: zc.RecordId,
		},
		remove: { delete: '/remove', query: zc.RecordId, ok: zc.RecordId },
	},
})

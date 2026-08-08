import { z } from 'zod'

import { zp, zq } from '@/shared/schema/index.ts'

import { UserDto } from '../user/user.contract.ts'

// ─── Embedded Assignment (with role + location) ───

export const AssignmentWithRelationsDto = z.object({
	id: zp.id,
	roleId: zp.id,
	locationId: zp.id.nullable(),
	role: z.object({
		id: zp.id,
		code: zp.str,
		name: zp.str,
	}),
	location: z
		.object({
			id: zp.id,
			code: zp.str,
			name: zp.str,
		})
		.nullable(),
})
export type AssignmentWithRelationsDto = z.infer<typeof AssignmentWithRelationsDto>

// ─── User Detail (user + assignments with relations) ───

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(AssignmentWithRelationsDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

// ─── User List Item (user + role names) ───

export const UserListItemDto = z.object({
	...UserDto.shape,
	roleNames: z.array(zp.str),
})
export type UserListItemDto = z.infer<typeof UserListItemDto>

// ─── Filter (reuse user filter shape) ───

export const ComposedUserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type ComposedUserFilterDto = z.infer<typeof ComposedUserFilterDto>

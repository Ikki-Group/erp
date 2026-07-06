import z from 'zod'

import { zq } from '@/shared/schema'

import { LocationDto } from '@/modules/location'

import { UserAssignmentDto } from '../assignment/assignment.contract'
import { RoleDto } from '../role/role.contract'
import { UserDto } from '../user/user.contract'

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


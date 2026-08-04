import { z } from 'zod'

import { zp, zq } from '@/shared/schema'

import { LocationSchema } from '@/modules/location'

import { UserAssignmentDto } from '../assignment/assignment.contract'
import { RoleDto } from '../role/role.contract'
import { UserDto } from '../user/user.contract'

const UserAssignmentWithRelationsDto = z.object({
	...UserAssignmentDto.shape,
	role: RoleDto,
	location: LocationSchema,
})

export const UserDetailDto = z.object({
	...UserDto.shape,
	hasGlobalAccess: zp.bool,
	assignments: z.array(UserAssignmentWithRelationsDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zq.boolean.optional(),
	locationId: zq.id.optional(),
	roleId: zq.id.optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

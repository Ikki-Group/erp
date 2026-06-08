import z from 'zod'

import { zq } from '@/shared/schema'

import { LocationSchema } from '@/modules/location'

import { UserAssignmentSchema } from '../assignment/assignment.schema'
import { RoleSchema } from '../role/role.schema'
import { UserSchema } from '../user/user.schema'

export const UserDetailSchema = z.object({
	...UserSchema.shape,
	assignments: z.array(
		z.object({
			...UserAssignmentSchema.shape,
			role: RoleSchema,
			location: LocationSchema,
		}),
	),
})
export type UserDetailSchema = z.infer<typeof UserDetailSchema>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zq.boolean.optional(),
	isRoot: zq.boolean.optional(),
	locationId: zq.id.optional(),
})
export type UserFilterSchema = z.infer<typeof UserFilterSchema>

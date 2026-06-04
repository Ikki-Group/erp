import { z } from 'zod'

import { LocationSchema } from '@/modules/location'

import { UserAssignmentSchema } from '../assignment/assignment.schema'
import { RoleSchema } from '../role/role.schema'
import { UserSchema } from './user.schema'

export const UserReadDetailSchema = z.object({
	...UserSchema.shape,
	assignments: z.array(
		z.object({
			...UserAssignmentSchema.shape,
			role: RoleSchema,
			location: LocationSchema,
		}),
	),
})
export type UserReadDetailSchema = z.infer<typeof UserReadDetailSchema>

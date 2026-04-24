import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const UserAssignmentDto = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	addedAt: zp.date,
	addedBy: zp.id.nullable(),
})
export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UserAssignmentUpsertDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
})
export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const UserAssignmentFilterDto = z.object({
	...zq.pagination.shape,
	userId: zq.id.optional(),
	roleId: zq.id.optional(),
	locationId: zq.id.optional(),
})
export type UserAssignmentFilterDto = z.infer<typeof UserAssignmentFilterDto>

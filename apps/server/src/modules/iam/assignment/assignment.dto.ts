import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

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

/* ---------------------------------- FILTER ---------------------------------- */

export const UserAssignmentFilterDto = z.object({
	...zq.pagination.shape,
	userId: zq.id.optional(),
	roleId: zq.id.optional(),
	locationId: zq.id.optional(),
})
export type UserAssignmentFilterDto = z.infer<typeof UserAssignmentFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UserAssignmentUpsertDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
})
export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

export const AssignmentBulkBodyDto = z.object({
	userIds: z.array(zp.id),
	locationId: zp.id,
	roleId: zp.id,
})
export type AssignmentBulkBodyDto = z.infer<typeof AssignmentBulkBodyDto>

export const AssignmentRemoveBodyDto = z.object({
	userId: zp.id,
	locationId: zp.id,
})
export type AssignmentRemoveBodyDto = z.infer<typeof AssignmentRemoveBodyDto>

export const AssignmentRemoveBulkBodyDto = z.object({
	userIds: z.array(zp.id),
	locationId: zp.id,
})
export type AssignmentRemoveBulkBodyDto = z.infer<typeof AssignmentRemoveBulkBodyDto>

import { z } from 'zod'

import { zp, zq } from '@/shared/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const UserAssignmentSchema = z.object({
	id: zp.id,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	addedAt: zp.date,
	addedBy: zp.id.nullable(),
})
export type UserAssignmentSchema = z.infer<typeof UserAssignmentSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const UserAssignmentUpsertSchema = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
})
export type UserAssignmentUpsertSchema = z.infer<typeof UserAssignmentUpsertSchema>

export const AssignmentBulkBodySchema = z.object({
	userIds: z.array(zp.id),
	locationId: zp.id,
	roleId: zp.id,
})
export type AssignmentBulkBodySchema = z.infer<typeof AssignmentBulkBodySchema>

export const AssignmentRemoveBodySchema = z.object({
	userId: zp.id,
	locationId: zp.id,
})
export type AssignmentRemoveBodySchema = z.infer<typeof AssignmentRemoveBodySchema>

export const AssignmentRemoveBulkBodySchema = z.object({
	userIds: z.array(zp.id),
	locationId: zp.id,
})
export type AssignmentRemoveBulkBodySchema = z.infer<typeof AssignmentRemoveBulkBodySchema>

/* --------------------------------- FILTER --------------------------------- */

export const UserAssignmentFilterSchema = z.object({
	...zq.pagination.shape,
	userId: zq.id.optional(),
	roleId: zq.id.optional(),
	locationId: zq.id.optional(),
})
export type UserAssignmentFilterSchema = z.infer<typeof UserAssignmentFilterSchema>

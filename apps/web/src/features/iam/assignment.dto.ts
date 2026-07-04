// MANUAL (not generated) — no server contract exists for assignment yet.
// UserAssignmentDto is re-used from the generated iam.dto to avoid duplication.
import { z, zp, zq } from '@/lib/validation'

export { UserAssignmentDto } from './iam.dto'

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

/* ---------------------------------- FILTER ---------------------------------- */

export const UserAssignmentFilterDto = z.object({
	...zq.pagination.shape,
	userId: zq.id.optional(),
	roleId: zq.id.optional(),
	locationId: zq.id.optional(),
})
export type UserAssignmentFilterDto = z.infer<typeof UserAssignmentFilterDto>

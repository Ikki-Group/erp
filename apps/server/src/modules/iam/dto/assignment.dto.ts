import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const UserAssignmentDto = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	isDefault: zp.bool,
	...zc.AuditFull.shape,
})
export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

export const UserAssignmentDetailDto = UserAssignmentDto.extend({
	roleName: zp.str,
	roleCode: zp.str,
	locationName: zp.str,
	locationCode: zp.str,
})
export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UserAssignmentUpsertDto = z.object({
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	isDefault: zp.bool.default(false),
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

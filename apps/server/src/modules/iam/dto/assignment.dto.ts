import { z } from 'zod'

import { zc, zp } from '@/core/validation'

export const UserAssignmentDto = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	isDefault: zp.bool,
	...zc.AuditFull.shape,
})
export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

export const UserAssignmentDetailDto = z.object({
	...UserAssignmentDto.shape,
	// role: zc.o,
})
export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

/**
 * Input for upserting a User Assignment.
 */
export const UserAssignmentUpsertDto = UserAssignmentBaseDto
export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

/**
 * Filter criteria for listing User Assignments.
 */
export const UserAssignmentFilterDto = z.object({
	...zPaginationDto.shape,
	userId: zQueryId.optional(),
	roleId: zQueryId.optional(),
	locationId: zQueryId.optional(),
})
export type UserAssignmentFilterDto = z.infer<typeof UserAssignmentFilterDto>

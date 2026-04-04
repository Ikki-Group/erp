import { z } from 'zod'

import { zBool, zId, zMetadataDto, zPaginationDto, zRecordIdDto } from '@/core/validation'

/**
 * Common User Assignment attributes.
 */
export const UserAssignmentBaseDto = z.object({ userId: zId, roleId: zId, locationId: zId, isDefault: zBool })
export type UserAssignmentBaseDto = z.infer<typeof UserAssignmentBaseDto>

/**
 * User Assignment database record.
 */
export const UserAssignmentDto = z.object({
  ...zRecordIdDto.shape,
  ...UserAssignmentBaseDto.shape,
  ...zMetadataDto.shape,
})
export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

/**
 * Detailed User Assignment (including role/location names/codes).
 */
export const UserAssignmentDetailDto = z.object({
  ...UserAssignmentDto.shape,
  roleName: z.string(),
  roleCode: z.string(),
  locationName: z.string(),
  locationCode: z.string(),
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
  userId: zId.optional(),
  roleId: zId.optional(),
  locationId: zId.optional(),
})
export type UserAssignmentFilterDto = z.infer<typeof UserAssignmentFilterDto>

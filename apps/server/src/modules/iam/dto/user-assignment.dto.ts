import { z } from 'zod'

import { zBool, zId, zMetadataDto, zPaginationDto } from '@/core/validation'

/**
 * Common User Assignment attributes.
 */
export const UserAssignmentBase = z.object({
  userId: zId,
  roleId: zId,
  locationId: zId,
  isDefault: zBool,
})
export type UserAssignmentBase = z.infer<typeof UserAssignmentBase>

/**
 * User Assignment database record.
 */
export const UserAssignment = z.object({
  ...zId.shape,
  ...UserAssignmentBase.shape,
  ...zMetadataDto.shape,
})
export type UserAssignment = z.infer<typeof UserAssignment>

/**
 * Detailed User Assignment (including role/location names/codes).
 */
export const UserAssignmentDetail = UserAssignment.extend({
  roleName: z.string(),
  roleCode: z.string(),
  locationName: z.string(),
  locationCode: z.string(),
})
export type UserAssignmentDetail = z.infer<typeof UserAssignmentDetail>

/**
 * Input for upserting a User Assignment.
 */
export const UserAssignmentUpsert = UserAssignmentBase
export type UserAssignmentUpsert = z.infer<typeof UserAssignmentUpsert>

/**
 * Filter criteria for listing User Assignments.
 */
export const UserAssignmentFilter = z.object({
  ...zPaginationDto.shape,
  userId: zId.optional(),
  roleId: zId.optional(),
  locationId: zId.optional(),
})
export type UserAssignmentFilter = z.infer<typeof UserAssignmentFilter>

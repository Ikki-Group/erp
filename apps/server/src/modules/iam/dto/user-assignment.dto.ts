import z from 'zod'

import { zBool, zId, zMetadataDto } from '@/core/validation'
import { LocationDto } from '@/modules/location'

import { RoleDto } from './role.dto'

/* ---------------------------------- BASE ---------------------------------- */

export const UserAssignmentBaseDto = z.object({
  locationId: zId,
  roleId: zId,
  isDefault: zBool,
})

export type UserAssignmentBaseDto = z.infer<typeof UserAssignmentBaseDto>

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
  id: zId,
  userId: zId,
  ...UserAssignmentBaseDto.shape,
  ...zMetadataDto.shape,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const UserAssignmentDetailDto = z.object({
  isDefault: zBool,
  location: LocationDto,
  role: RoleDto,
})

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

/* --------------------------------- UPSERT --------------------------------- */

export const UserAssignmentUpsertDto = UserAssignmentBaseDto

export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

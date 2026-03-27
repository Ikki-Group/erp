import z from 'zod'

import { LocationDto } from '@/features/location'
import { zBool, zId, zMetadataDto } from '@/lib/zod'

import { RoleDto } from './role.dto'

/* ---------------------------------- BASE ---------------------------------- */

export const UserAssignmentBase = z.object({
  locationId: zId,
  roleId: zId,
  isDefault: zBool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
  id: zId,
  userId: zId,
  ...UserAssignmentBase.shape,
  ...zMetadataDto.shape,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const UserAssignmentDetailDto = z.object({ isDefault: zBool, location: LocationDto, role: RoleDto })

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

/* --------------------------------- UPSERT --------------------------------- */

export const UserAssignmentUpsertDto = z.object({ ...UserAssignmentBase.shape })

export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

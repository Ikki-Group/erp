import z from 'zod'

import { zPrimitive, zSchema } from '@/core/validation'
import { LocationDto } from '@/modules/location'

import { RoleDto } from './role.dto'

/* ---------------------------------- BASE ---------------------------------- */

export const UserAssignmentBase = z.object({
  locationId: zPrimitive.id,
  roleId: zPrimitive.id,
  isDefault: zPrimitive.bool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  ...UserAssignmentBase.shape,
  ...zSchema.metadata.shape,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const UserAssignmentDetailDto = z.object({ isDefault: zPrimitive.bool, location: LocationDto, role: RoleDto })

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

/* --------------------------------- UPSERT --------------------------------- */

export const UserAssignmentUpsertDto = z.object({ ...UserAssignmentBase.shape })

export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

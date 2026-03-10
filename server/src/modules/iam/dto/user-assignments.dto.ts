import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

import { LocationDto } from '@/modules/location'

import { RoleDto } from './role.dto'

export const UserAssignmentDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  locationId: zPrimitive.id,
  roleId: zPrimitive.id,
  isDefault: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

export const UserAssignmentDetailDto = z.object({
  ...UserAssignmentDto.pick({
    isDefault: true,
  }).shape,
  location: LocationDto,
  role: RoleDto,
})

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

export const UserAssignmentUpsertDto = z.object({
  ...UserAssignmentDto.pick({
    locationId: true,
    roleId: true,
    isDefault: true,
  }).shape,
})

export type UserAssignmentUpsertDto = z.infer<typeof UserAssignmentUpsertDto>

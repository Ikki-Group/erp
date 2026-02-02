import z from 'zod'

import { zh } from '@/shared/zod'

export const UserEntity = z.object({
  id: zh.uuid,
  username: zh.str,
  email: zh.email,
  fullName: zh.str,
  displayName: zh.str.nullable(),
  isActive: zh.bool,
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type UserEntity = z.infer<typeof UserEntity>

export const RoleEntity = z.object({
  id: zh.uuid,
  code: zh.str,
  name: zh.str,
  description: zh.str.nullable(),
  permissionCodes: z.array(z.string()),
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type RoleEntity = z.infer<typeof RoleEntity>

export const UserRoleAssignmentEntity = z.object({
  id: zh.uuid,
  userId: zh.uuid,
  roleId: zh.uuid,
  locationId: zh.uuid.optional(),
  createdAt: zh.date,
})

export type UserRoleAssignmentEntity = z.infer<typeof UserRoleAssignmentEntity>

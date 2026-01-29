import { zh } from "@/utils/zod"
import z from "zod"

export const UserEntity = z.object({
  id: zh.str,
  username: zh.str,
  email: zh.email,
  roleId: zh.str.optional(),
  locationId: zh.str.optional(),
  isActive: zh.bool,
  isDeleted: zh.bool,
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type UserEntity = z.infer<typeof UserEntity>

export const RoleEntity = z.object({
  id: zh.str,
  name: zh.str,
  description: zh.str.optional(),
  permissionCodes: z.array(z.string()),
  createdAt: zh.date,
  updatedAt: zh.date,
})

export type RoleEntity = z.infer<typeof RoleEntity>

export const UserRoleAssignmentEntity = z.object({
  id: zh.str,
  userId: zh.str,
  roleId: zh.str,
  locationId: zh.str.optional(),
  createdAt: zh.date,
})

export type UserRoleAssignmentEntity = z.infer<typeof UserRoleAssignmentEntity>

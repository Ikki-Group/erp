import z from 'zod'

import { zSchema } from '@/lib/zod'

/**
 * IAM Schema Definitions
 * Zod schemas for IAM entities used in API responses
 */
export namespace IamSchema {
  export const User = z.object({
    id: zSchema.num,
    email: zSchema.email,
    username: zSchema.username,
    fullname: zSchema.str,
    isRoot: zSchema.bool,
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type User = z.infer<typeof User>

  export const Role = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    isSystem: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type Role = z.infer<typeof Role>

  export const UserRoleAssignment = z.object({
    id: zSchema.num,
    userId: zSchema.num,
    roleId: zSchema.num,
    locationId: zSchema.num,
    assignedAt: zSchema.date,
    assignedBy: zSchema.num,
  })

  export type UserRoleAssignment = z.infer<typeof UserRoleAssignment>
}

// Export schemas for use in controllers
export const UserSchema = IamSchema.User
export const UserRoleAssignmentSchema = IamSchema.UserRoleAssignment

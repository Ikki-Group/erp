import z from 'zod'

import { zSchema } from '@/lib/zod'

/**
 * IAM Schema Definitions
 * Zod schemas for IAM entities used in API responses
 */
export namespace IamSchema {
  /**
   * User Schema
   * Represents a user in the system
   */
  export const User = z.object({
    id: z.number(),
    email: z.string().email(),
    username: z.string(),
    fullname: z.string(),
    isRoot: z.boolean(),
    isActive: z.boolean(),
    ...zSchema.meta.shape,
  })

  export type User = z.infer<typeof User>

  /**
   * Role Schema
   * Represents a role in the system
   */
  export const Role = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    isSystem: z.boolean(),
    ...zSchema.meta.shape,
  })

  export type Role = z.infer<typeof Role>

  /**
   * User Role Assignment Schema
   * Represents a user-role-location assignment
   */
  export const UserRoleAssignment = z.object({
    id: z.number(),
    userId: z.number(),
    roleId: z.number(),
    locationId: z.number(),
    assignedAt: z.date(),
    assignedBy: z.number(),
  })

  export type UserRoleAssignment = z.infer<typeof UserRoleAssignment>
}

// Export schemas for use in controllers
export const UserSchema = IamSchema.User
export const RoleSchema = IamSchema.Role
export const UserRoleAssignmentSchema = IamSchema.UserRoleAssignment

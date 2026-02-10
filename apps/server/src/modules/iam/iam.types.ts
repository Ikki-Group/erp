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

  export const UserRoleAssignmentDetail = UserRoleAssignment.extend({
    role: Role.nullable(),
    location: z
      .object({
        id: zSchema.num,
        code: zSchema.str,
        name: zSchema.str,
      })
      .nullable(),
  })

  export type UserRoleAssignmentDetail = z.infer<typeof UserRoleAssignmentDetail>
  export const LoginRequest = z.object({
    identifier: z.string().describe('Email or Username'),
    password: z.string(),
  })

  export type LoginRequest = z.infer<typeof LoginRequest>

  export const UserWithAccess = User.extend({
    locations: z.array(
      z.object({
        id: zSchema.num,
        code: zSchema.str,
        name: zSchema.str,
        role: z.string(),
      })
    ),
  })

  export type UserWithAccess = z.infer<typeof UserWithAccess>

  export const AuthResponse = z.object({
    user: UserWithAccess,
    token: z.string(),
  })

  export type AuthResponse = z.infer<typeof AuthResponse>
}

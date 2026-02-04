import z from 'zod'

import { zh } from '@/shared/zod'

/**
 * IAM Schemas for API validation and type inference
 *
 * These schemas are used for:
 * - Request/response validation
 * - OpenAPI documentation
 * - Type inference for service layer
 */
export namespace IamSchema {
  export const User = z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    fullname: z.string(),
    isRoot: z.boolean(),
    isActive: z.boolean(),
    ...zh.meta.shape,
  })

  export type User = z.infer<typeof User>

  export const Role = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    ...zh.meta.shape,
  })

  export type Role = z.infer<typeof Role>

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

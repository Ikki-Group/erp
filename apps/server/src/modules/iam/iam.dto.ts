import z from 'zod'

import { zSchema } from '@/lib/zod'
import type { users } from '@/database/schema'

/**
 * IAM DTOs
 * Data Transfer Objects for IAM module validation
 */
export namespace IamDto {
  export type User = typeof users.$inferSelect

  /**
   * Create User DTO
   * Validation schema for creating a new user
   */
  export const CreateUser = z.object({
    email: zSchema.email,
    username: zSchema.username,
    fullname: zSchema.str.min(1, 'Full name is required').max(255, 'Full name too long'),
    password: zSchema.password,
  })

  export type CreateUser = z.infer<typeof CreateUser>

  /**
   * Update User DTO
   * Validation schema for updating an existing user
   * All fields are optional
   */
  export const UpdateUser = z.object({
    email: zSchema.email.optional(),
    username: zSchema.username.optional(),
    fullname: zSchema.str.min(1).max(255).optional(),
    password: zSchema.password.optional(),
    isActive: zSchema.bool.optional(),
  })

  export type UpdateUser = z.infer<typeof UpdateUser>

  /**
   * List Users DTO
   * Query parameters for listing users with pagination and filtering
   */
  export const ListUsers = zSchema.pagination.extend({
    search: z.string().optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
  })

  export type ListUsers = z.infer<typeof ListUsers>
}

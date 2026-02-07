import z from 'zod'

import { zSchema } from '@/lib/zod'
import type { roles, userRoleAssignments, users } from '@/database/schema'

/**
 * Data Transfer Objects for IAM module validation
 */
export namespace IamDto {
  // ============================================================================
  // User DTOs
  // ============================================================================

  export type User = typeof users.$inferSelect

  /**
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
   * Query parameters for listing users with pagination and filtering
   */
  export const ListUsers = zSchema.pagination.extend({
    search: zSchema.query.search,
    isActive: zSchema.query.boolean,
  })

  export type ListUsers = z.infer<typeof ListUsers>

  // ============================================================================
  // Role DTOs
  // ============================================================================

  export type Role = typeof roles.$inferSelect

  /**
   * Validation schema for creating a new role
   */
  export const CreateRole = z.object({
    code: zSchema.str.min(2, 'Role code must be at least 2 characters').max(50, 'Role code too long'),
    name: zSchema.str.min(2, 'Role name must be at least 2 characters').max(255, 'Role name too long'),
    isSystem: zSchema.bool.optional(),
  })

  export type CreateRole = z.infer<typeof CreateRole>

  /**
   * Validation schema for updating an existing role
   * All fields are optional
   */
  export const UpdateRole = z.object({
    code: zSchema.str.min(2).max(50).optional(),
    name: zSchema.str.min(2).max(255).optional(),
  })

  export type UpdateRole = z.infer<typeof UpdateRole>

  /**
   * Query parameters for listing roles with pagination and filtering
   */
  export const ListRoles = zSchema.pagination.extend({
    search: zSchema.query.search,
    isSystem: zSchema.query.boolean,
  })

  export type ListRoles = z.infer<typeof ListRoles>

  // ============================================================================
  // User Role Assignment DTOs
  // ============================================================================

  export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect

  /**
   * Validation schema for assigning a role to a user at a location
   */
  export const AssignRole = z.object({
    userId: zSchema.num.int().positive('User ID must be positive'),
    roleId: zSchema.num.int().positive('Role ID must be positive'),
    locationId: zSchema.num.int().positive('Location ID must be positive'),
  })

  export type AssignRole = z.infer<typeof AssignRole>

  /**
   * Query parameters for listing user role assignments with pagination and filtering
   */
  export const ListUserRoleAssignments = zSchema.pagination.extend({
    userId: zSchema.query.id,
    roleId: zSchema.query.id,
    locationId: zSchema.query.id,
  })

  export type ListUserRoleAssignments = z.infer<typeof ListUserRoleAssignments>
}

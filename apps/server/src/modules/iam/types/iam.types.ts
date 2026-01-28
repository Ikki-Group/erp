import type { users, roles, userRoleAssignments, locations } from "@/db/schema"
import type { PermissionArray } from "@/core/rbac"

/**
 * IAM Module Type Definitions
 */

/**
 * User entity from database
 */
export type User = typeof users.$inferSelect

/**
 * Role entity from database
 */
export type Role = typeof roles.$inferSelect

/**
 * User role assignment entity from database
 */
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect

/**
 * Location entity from database
 */
export type Location = typeof locations.$inferSelect

/**
 * User with full details (joined with roles and locations)
 */
export interface UserWithDetails extends User {
  roles: Array<{
    roleId: string
    roleCode: string
    roleName: string
    locationId: string | null
    locationCode: string | null
    locationName: string | null
    permissions: PermissionArray
  }>
  effectivePermissions: PermissionArray
  isSuperAdmin: boolean
}

/**
 * Role with assignment count
 */
export interface RoleWithStats extends Role {
  userCount: number
}

/**
 * User list filter options
 */
export interface UserListFilter {
  roleId?: string
  locationId?: string
  isActive?: boolean
  isDeleted?: boolean
  search?: string
}

/**
 * Role list filter options
 */
export interface RoleListFilter {
  search?: string
}

/**
 * Location list filter options
 */
export interface LocationListFilter {
  type?: string
  isActive?: boolean
  search?: string
}

import type { PERMISSIONS, SUPERADMIN_PERMISSION } from './permissions.const'

/**
 * Type-safe permission types derived from permission constants
 */

/**
 * Extract all permission literal types from nested permission object
 */
type ExtractPermissions<T> = T extends string
  ? T
  : T extends object
    ? { [K in keyof T]: ExtractPermissions<T[K]> }[keyof T]
    : never

/**
 * Union type of all valid permission strings
 */
export type Permission = ExtractPermissions<typeof PERMISSIONS>

/**
 * Permission or superadmin wildcard
 */
export type PermissionValue = Permission | typeof SUPERADMIN_PERMISSION

/**
 * Array of permissions
 */
export type PermissionArray = PermissionValue[]

/**
 * Permission check mode
 */
export type PermissionCheckMode = 'AND' | 'OR'

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean
  missingPermissions?: Permission[]
}

/**
 * User permissions (from role assignments)
 */
export interface UserPermissions {
  permissions: PermissionArray
  isSuperAdmin: boolean
}

/**
 * Location-scoped permission context
 */
export interface PermissionContext {
  userId: string
  locationId?: string
}

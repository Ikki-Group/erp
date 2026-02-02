import { SUPERADMIN_PERMISSION } from './permissions.const'
import type {
  Permission,
  PermissionArray,
  PermissionCheckMode,
  PermissionCheckResult,
  UserPermissions,
} from './permissions.types'

/**
 * Permission checking utility for RBAC
 */
export class PermissionChecker {
  /**
   * Check if user has permission(s)
   *
   * @param userPermissions - User's permissions from roles
   * @param requiredPermissions - Required permission(s)
   * @param mode - Check mode: AND (all required) or OR (at least one required)
   * @returns Permission check result
   */
  static check(
    userPermissions: UserPermissions,
    requiredPermissions: Permission | Permission[],
    mode: PermissionCheckMode = 'AND'
  ): PermissionCheckResult {
    // Superadmin has all permissions
    if (userPermissions.isSuperAdmin) {
      return { allowed: true }
    }

    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

    return mode === 'AND'
      ? PermissionChecker.checkAll(userPermissions.permissions, required)
      : PermissionChecker.checkAny(userPermissions.permissions, required)
  }

  /**
   * Check if user has ALL required permissions (AND logic)
   */
  private static checkAll(userPermissions: PermissionArray, requiredPermissions: Permission[]): PermissionCheckResult {
    const missing = requiredPermissions.filter(
      (required) => !PermissionChecker.hasPermission(userPermissions, required)
    )

    return {
      allowed: missing.length === 0,
      ...(missing.length > 0 && { missingPermissions: missing }),
    }
  }

  /**
   * Check if user has ANY of the required permissions (OR logic)
   */
  private static checkAny(userPermissions: PermissionArray, requiredPermissions: Permission[]): PermissionCheckResult {
    const hasAny = requiredPermissions.some((required) => PermissionChecker.hasPermission(userPermissions, required))

    return {
      allowed: hasAny,
      missingPermissions: hasAny ? undefined : requiredPermissions,
    }
  }

  /**
   * Check if a specific permission exists in user's permission array
   */
  private static hasPermission(userPermissions: PermissionArray, permission: Permission): boolean {
    return userPermissions.includes(SUPERADMIN_PERMISSION) || userPermissions.includes(permission)
  }

  /**
   * Get unique permissions from multiple role assignments
   */
  static mergePermissions(rolePermissions: PermissionArray[]): UserPermissions {
    const allPermissions = rolePermissions.flat()
    const uniquePermissions = [...new Set(allPermissions)]
    const isSuperAdmin = uniquePermissions.includes(SUPERADMIN_PERMISSION)

    return {
      permissions: uniquePermissions,
      isSuperAdmin,
    }
  }

  /**
   * Check if permissions array contains superadmin wildcard
   */
  static isSuperAdmin(permissions: PermissionArray): boolean {
    return permissions.includes(SUPERADMIN_PERMISSION)
  }
}

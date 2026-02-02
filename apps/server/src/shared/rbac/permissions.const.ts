/**
 * Type-safe permission constants for RBAC
 *
 * Permission format: MODULE.RESOURCE.ACTION
 * Example: iam.users.create, inventory.products.read
 */

/**
 * All permission definitions
 */
export const PERMISSIONS = {
  /**
   * IAM Module Permissions
   */
  IAM: {
    USERS: {
      READ: 'iam.users.read',
      CREATE: 'iam.users.create',
      UPDATE: 'iam.users.update',
      DELETE: 'iam.users.delete',
      UPDATE_PASSWORD: 'iam.users.update_password',
    },
    ROLES: {
      READ: 'iam.roles.read',
      CREATE: 'iam.roles.create',
      UPDATE: 'iam.roles.update',
      DELETE: 'iam.roles.delete',
    },
    PERMISSIONS: {
      READ: 'iam.permissions.read',
    },
  },

  /**
   * Inventory Module Permissions
   */
  INVENTORY: {
    PRODUCTS: {
      READ: 'inventory.products.read',
      CREATE: 'inventory.products.create',
      UPDATE: 'inventory.products.update',
      DELETE: 'inventory.products.delete',
    },
    CATEGORIES: {
      READ: 'inventory.categories.read',
      CREATE: 'inventory.categories.create',
      UPDATE: 'inventory.categories.update',
      DELETE: 'inventory.categories.delete',
    },
    STOCK: {
      READ: 'inventory.stock.read',
      ADJUST: 'inventory.stock.adjust',
    },
  },

  /**
   * Location Module Permissions
   */
  LOCATION: {
    LOCATIONS: {
      READ: 'location.locations.read',
      CREATE: 'location.locations.create',
      UPDATE: 'location.locations.update',
      DELETE: 'location.locations.delete',
    },
  },
} as const

/**
 * Special permission for superadmin (grants all permissions)
 */
export const SUPERADMIN_PERMISSION = '*' as const

/**
 * Extract all permission values into a flat array
 */
function extractPermissions(obj: any, result: string[] = []): string[] {
  for (const key in obj) {
    const value = obj[key]
    if (typeof value === 'string') {
      result.push(value)
    } else if (typeof value === 'object') {
      extractPermissions(value, result)
    }
  }
  return result
}

/**
 * All permission values as a flat array
 */
export const ALL_PERMISSIONS = extractPermissions(PERMISSIONS)

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  IAM_USERS: Object.values(PERMISSIONS.IAM.USERS),
  IAM_ROLES: Object.values(PERMISSIONS.IAM.ROLES),
  IAM_PERMISSIONS: Object.values(PERMISSIONS.IAM.PERMISSIONS),
  INVENTORY_PRODUCTS: Object.values(PERMISSIONS.INVENTORY.PRODUCTS),
  INVENTORY_CATEGORIES: Object.values(PERMISSIONS.INVENTORY.CATEGORIES),
  INVENTORY_STOCK: Object.values(PERMISSIONS.INVENTORY.STOCK),
  LOCATION_LOCATIONS: Object.values(PERMISSIONS.LOCATION.LOCATIONS),
} as const

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission: string): boolean {
  return permission === SUPERADMIN_PERMISSION || ALL_PERMISSIONS.includes(permission)
}

/**
 * Validate an array of permissions
 */
export function validatePermissions(permissions: string[]): {
  valid: boolean
  invalid: string[]
} {
  const invalid = permissions.filter((p) => !isValidPermission(p))
  return {
    valid: invalid.length === 0,
    invalid,
  }
}

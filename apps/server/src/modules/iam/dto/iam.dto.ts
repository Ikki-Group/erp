import { z } from "zod"
import {
  uuidSchema,
  emailSchema,
  usernameSchema,
  passwordSchema,
  paginationSchema,
  sortSchema,
  booleanStringSchema,
} from "@/shared/validators"
import { validatePermissions } from "@/core/rbac"

/**
 * IAM Module DTO (Data Transfer Object) Schemas
 */

// ============================================================================
// User DTOs
// ============================================================================

/**
 * Create user request DTO
 */
export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(1, "Full name is required").max(255),
  displayName: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
  roleAssignments: z
    .array(
      z.object({
        roleId: uuidSchema,
        locationId: uuidSchema.optional(),
      }),
    )
    .min(1, "At least one role assignment is required"),
})

export type CreateUserDto = z.infer<typeof createUserSchema>

/**
 * Update user request DTO
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  fullName: z.string().min(1).max(255).optional(),
  displayName: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  roleAssignments: z
    .array(
      z.object({
        roleId: uuidSchema,
        locationId: uuidSchema.optional(),
      }),
    )
    .optional(),
})

export type UpdateUserDto = z.infer<typeof updateUserSchema>

/**
 * Update password request DTO
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
})

export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>

/**
 * User list query parameters DTO
 */
export const userListQuerySchema = paginationSchema.merge(sortSchema).merge(
  z.object({
    roleId: uuidSchema.optional(),
    locationId: uuidSchema.optional(),
    isActive: booleanStringSchema.optional(),
    isDeleted: booleanStringSchema.optional(),
    search: z.string().optional(),
  }),
)

export type UserListQueryDto = z.infer<typeof userListQuerySchema>

// ============================================================================
// Role DTOs
// ============================================================================

/**
 * Create role request DTO
 */
export const createRoleSchema = z
  .object({
    code: z
      .string()
      .min(1, "Role code is required")
      .max(100)
      .regex(
        /^[A-Z0-9_-]+$/,
        "Role code must be uppercase letters, numbers, underscores, or hyphens only",
      ),
    name: z.string().min(1, "Role name is required").max(255),
    description: z.string().optional(),
    permissionCodes: z
      .array(z.string())
      .min(1, "At least one permission is required"),
  })
  .refine(
    (data) => {
      const validation = validatePermissions(data.permissionCodes)
      return validation.valid
    },
    (data) => {
      const validation = validatePermissions(data.permissionCodes)
      return {
        message: `Invalid permissions: ${validation.invalid.join(", ")}`,
        path: ["permissionCodes"],
      }
    },
  )

export type CreateRoleDto = z.infer<typeof createRoleSchema>

/**
 * Update role request DTO
 */
export const updateRoleSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    permissionCodes: z.array(z.string()).min(1).optional(),
  })
  .refine(
    (data) => {
      if (!data.permissionCodes) return true
      const validation = validatePermissions(data.permissionCodes)
      return validation.valid
    },
    (data) => {
      if (!data.permissionCodes) return { message: "" }
      const validation = validatePermissions(data.permissionCodes)
      return {
        message: `Invalid permissions: ${validation.invalid.join(", ")}`,
        path: ["permissionCodes"],
      }
    },
  )

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>

/**
 * Role list query parameters DTO
 */
export const roleListQuerySchema = paginationSchema.merge(sortSchema).merge(
  z.object({
    search: z.string().optional(),
  }),
)

export type RoleListQueryDto = z.infer<typeof roleListQuerySchema>

// ============================================================================
// Location DTOs
// ============================================================================

/**
 * Create location request DTO
 */
export const createLocationSchema = z.object({
  code: z
    .string()
    .min(1, "Location code is required")
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Location code must be uppercase letters, numbers, underscores, or hyphens only",
    ),
  name: z.string().min(1, "Location name is required").max(255),
  type: z.string().min(1, "Location type is required").max(50),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: emailSchema.optional(),
  isActive: z.boolean().default(true),
})

export type CreateLocationDto = z.infer<typeof createLocationSchema>

/**
 * Update location request DTO
 */
export const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(50).optional(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: emailSchema.optional().nullable(),
  isActive: z.boolean().optional(),
})

export type UpdateLocationDto = z.infer<typeof updateLocationSchema>

/**
 * Location list query parameters DTO
 */
export const locationListQuerySchema = paginationSchema.merge(sortSchema).merge(
  z.object({
    type: z.string().optional(),
    isActive: booleanStringSchema.optional(),
    search: z.string().optional(),
  }),
)

export type LocationListQueryDto = z.infer<typeof locationListQuerySchema>

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Login request DTO
 */
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export type LoginDto = z.infer<typeof loginSchema>

/**
 * Login response DTO
 */
export interface LoginResponseDto {
  token: string
  user: {
    id: string
    username: string
    email: string
    fullName: string
    displayName: string | null
  }
}

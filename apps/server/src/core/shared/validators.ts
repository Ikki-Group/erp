import { z } from "zod"
import { PAGINATION } from "./constants"

/**
 * Common Zod validation schemas
 */

/**
 * UUID validator
 */
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" })

/**
 * Pagination query parameters validator
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(PAGINATION.DEFAULT_PAGE)
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_LIMIT, `Limit must be at least ${PAGINATION.MIN_LIMIT}`)
    .max(PAGINATION.MAX_LIMIT, `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`)
    .default(PAGINATION.DEFAULT_LIMIT)
    .optional(),
})

/**
 * Sort query parameters validator
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc").optional(),
})

/**
 * Email validator
 */
export const emailSchema = z
  .string()
  .email({ message: "Invalid email format" })
  .max(255, "Email must not exceed 255 characters")

/**
 * Username validator
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must not exceed 50 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens",
  )

/**
 * Password validator
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

/**
 * Boolean string validator (for query params)
 */
export const booleanStringSchema = z
  .string()
  .transform((val) => val === "true")
  .or(z.boolean())

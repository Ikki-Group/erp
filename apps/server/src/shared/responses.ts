import { z } from 'zod'

/**
 * Standard Pagination Meta Schema
 */
export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/**
 * Base Response Schema
 */
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

/**
 * Success Response Schema Factory
 */
export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
  })

/**
 * Paginated Response Schema Factory
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  })

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    stack: z.string().optional(),
  }),
})

/**
 * Utility functions for responding
 */

export const successResponse = <T>(data: T, message?: string) => ({
  success: true as const,
  message,
  data,
})

export const paginatedResponse = <T>(data: T[], meta: PaginationMeta, message?: string) => ({
  success: true as const,
  message,
  data,
  meta,
})

export const errorResponse = (code: string, message: string, details?: Record<string, unknown>, stack?: string) => ({
  success: false as const,
  error: {
    code,
    message,
    details,
    stack,
  },
})

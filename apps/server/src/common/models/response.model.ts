import { z } from "zod"

/**
 * Standard API Response Schemas
 * Follows consistent format for all API responses
 */

// ============ Success Response ============

/**
 * Standard success response wrapper
 */
export const successSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

/**
 * Build success response
 */
export function success<T>(data: T) {
  return {
    success: true as const,
    data,
  }
}

// ============ Error Response ============

/**
 * Standard error response schema
 */
export const errorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
})

export type ErrorResponse = z.infer<typeof errorSchema>

/**
 * Build error response
 */
export function error(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
}

// ============ Common Responses ============

/**
 * Message-only response (for simple operations)
 */
export const messageSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
})

export type MessageResponse = z.infer<typeof messageSchema>

/**
 * Build message response
 */
export function message(msg: string): MessageResponse {
  return {
    success: true,
    data: { message: msg },
  }
}

// ============ Common Params ============

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type IdParam = z.infer<typeof idParamSchema>

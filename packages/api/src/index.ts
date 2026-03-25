/**
 * Shared API SDK and Zod Schemas for Ikki ERP
 */
import { z } from 'zod'

// Base Response Template
export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.boolean(), data: dataSchema.optional(), error: z.string().optional() })

export type ResponseDto<T> = { success: boolean; data?: T; error?: string }

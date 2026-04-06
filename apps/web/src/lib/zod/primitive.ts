import z from 'zod'

/* -------------------------------------------------------------------------- */
/*                          Primitive Zod Schemas                             */
/* -------------------------------------------------------------------------- */

// ─── Base Types ───────────────────────────────────────────────────────────────

export const zStr = z.string().trim()
export const zStrNullable = z
  .string()
  .trim()
  .transform((val) => (val === '' ? null : val))
  .nullable()
export const zNum = z.number()
export const zNumCoerce = z.coerce.number()
export const zDate = z.coerce.date()
export const zBool = z.boolean()
export const zEmail = z.string().email().transform((v) => v.toLowerCase())
export const zUuid = z.string().uuid()

/** Standard Primary Key validation (Coerced Integer). */
export const zId = z.coerce.number().int().positive()

// ─── Domain-specific ──────────────────────────────────────────────────────────

export const zCodeUpper = z.string().trim().toUpperCase()
export const zPassword = z
  .string()
  .trim()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
export const zUsername = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')
  .transform((v) => v.toLowerCase())

/** Decimal string — for monetary amounts, prices, quantities stored as string (e.g. Decimal DB columns). */
export const zDecimal = z.string().trim()

/** Sort order / display order integer */
export const zSortOrder = z.number().int().nonnegative()

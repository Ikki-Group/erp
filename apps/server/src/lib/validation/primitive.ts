import z from 'zod'

// Base types
const str = z.string().trim()
const strNullable = z
  .string()
  .trim()
  .nullable()
  .transform((val) => val?.trim() || null)
const num = z.number()
const numCoerce = z.coerce.number()
const date = z.coerce.date()
const bool = z.boolean()
const email = z.email()
const uuid = z.uuidv7()

// Domain-specific
const codeUpper = z.string().trim().toUpperCase()
const password = z
  .string()
  .trim()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')

export const zPrimitive = {
  str,
  strNullable,
  num,
  numCoerce,
  date,
  bool,
  email,
  uuid,
  codeUpper,
  password,
  username,
}

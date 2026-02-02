import z from 'zod'

/**
 * Common Zod schema helpers for consistent validation
 */

const str = z.string().trim()
const email = z.email()
const num = z.number()
const bool = z.boolean()
const date = z.date()
const uuid = z.uuid()

export const zh = {
  str,
  email,
  num,
  bool,
  date,
  uuid,
}

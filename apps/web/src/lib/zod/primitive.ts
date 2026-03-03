import z from 'zod'

const str = z.string().trim()
const strRequired = str.min(1)
const strNullable = z
  .string()
  .trim()
  .nullable()
  .transform(val => val?.trim() || null)

const num = z.number()
const numCoerce = z.coerce.number()

/** Integer ID (serial PK). Accepts string or number, coerces to positive integer. */
const id = z.coerce.number().int().positive()

const date = z.coerce.date()
const bool = z.boolean()
const email = z.email()
const uuid = z.uuidv7()

export const zPrimitive = {
  str,
  strRequired,
  strNullable,
  num,
  numCoerce,
  id,
  date,
  bool,
  email,
  uuid,
}

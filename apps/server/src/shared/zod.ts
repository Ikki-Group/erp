import z from 'zod'

const str = z.string().trim()
const email = z.email()
const num = z.number()
const bool = z.boolean()
const date = z.date()
const uuid = z.uuid()

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')

const username = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')

const pagination = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100').default(10),
})

export const zh = {
  str,
  email,
  num,
  bool,
  date,
  uuid,

  password,
  username,
  pagination,
}

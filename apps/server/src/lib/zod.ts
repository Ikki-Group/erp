import z from 'zod'

export namespace zh {
  export const str = z.string().trim()
  export const email = z.email()
  export const num = z.number()
  export const bool = z.boolean()
  export const date = z.coerce.date()
  export const uuid = z.uuid()

  export const password = str
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')

  export const username = str
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')

  export const pagination = z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100').default(10),
  })

  export const meta = z.object({
    createdAt: date,
    updatedAt: date,
    createdBy: num,
    updatedBy: num,
  })

  export function buildResOk<T extends z.ZodTypeAny>(data: T) {
    return z.object({
      code: z.string().default('OK'),
      success: z.literal(true),
      data,
    })
  }
}

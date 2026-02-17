import { z } from 'zod'

export const zSchema = {
  num: z.number(),
  numCoerce: z.coerce.number(),
  str: z.string(),
  bool: z.boolean(),
  date: z.date(),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    ),
  pagination: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),
  meta: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
}

export const zResponse = {
  ok: <T extends z.ZodTypeAny>(data: T) =>
    z.object({
      success: z.boolean(),
      code: z.string(),
      data: data,
    }),
  paginated: <T extends z.ZodTypeAny>(data: T) =>
    z.object({
      success: z.boolean(),
      code: z.string(),
      data: z.object({
        data: data,
        meta: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      }),
    }),
}

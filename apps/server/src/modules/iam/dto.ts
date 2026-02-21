import z from 'zod'

import { zSchema } from '@/lib/validation'

export const RoleDto = z.object({
  id: z.number(),
  code: z.string().transform((val) => val.toUpperCase().trim()),
  name: z.string(),
  isSystem: z.boolean(),
  ...zSchema.meta.shape,
})

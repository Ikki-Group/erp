import z from 'zod'

import { zSchema } from '@server/lib/zod'

/**
 * Location Schema Definitions
 */
export namespace LocationSchema {
  export const Location = z.object({
    id: zSchema.num,
    code: zSchema.str,
    name: zSchema.str,
    type: z.enum(['store', 'warehouse', 'central_warehouse']),
    description: z.string().nullable(),
    isActive: zSchema.bool,
    ...zSchema.meta.shape,
  })

  export type Location = z.infer<typeof Location>
}

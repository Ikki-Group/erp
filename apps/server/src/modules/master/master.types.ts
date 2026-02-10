import { zSchema } from '@server/lib/zod'
import z from 'zod'

export namespace MasterSchema {
  export const Uom = z.object({
    code: z.string().min(1, 'Code is required'),
    ...zSchema.meta.shape,
  })

  export type Uom = z.infer<typeof Uom>
}

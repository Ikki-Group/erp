import z from 'zod'

import { zPrimitive } from '@/lib/validation'

export const SessionDto = z.object({
  id: zPrimitive.objId,
  userId: zPrimitive.objId,
  createdAt: zPrimitive.date,
  expiredAt: zPrimitive.date,
})

export type SessionDto = z.infer<typeof SessionDto>

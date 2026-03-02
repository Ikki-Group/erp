import z from 'zod'

import { zPrimitive } from '@/lib/validation'

export const SessionDto = z.object({
  id: zPrimitive.objId,
  userId: zPrimitive.objId,
  createdAt: zPrimitive.date,
  expiredAt: zPrimitive.date,
})

export type SessionDto = z.infer<typeof SessionDto>

export const SessionDataDto = z.object({
  userId: zPrimitive.objId,
  email: zPrimitive.email,
  username: zPrimitive.str,
})

export type SessionDataDto = z.infer<typeof SessionDataDto>

import z from 'zod'

import { zPrimitive } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SessionDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  createdAt: zPrimitive.date,
  expiredAt: zPrimitive.date,
})

export type SessionDto = z.infer<typeof SessionDto>

export const SessionDataDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  email: zPrimitive.email,
  username: zPrimitive.str,
})

export type SessionDataDto = z.infer<typeof SessionDataDto>

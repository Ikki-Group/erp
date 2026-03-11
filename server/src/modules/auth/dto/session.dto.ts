import z from 'zod'

import { zPrimitive } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SessionDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  createdAt: zPrimitive.date,
  expiredAt: zPrimitive.date,
})

export type SessionDto = z.infer<typeof SessionDto>

/* --------------------------------- PAYLOAD -------------------------------- */

export const SessionPayloadDto = z.object({
  id: zPrimitive.id,
  userId: zPrimitive.id,
  email: zPrimitive.email,
  username: zPrimitive.str,
})

export type SessionPayloadDto = z.infer<typeof SessionPayloadDto>

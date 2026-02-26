import z from 'zod'

import { zPrimitive } from '@/lib/validation'

export const UserSessionDto = z.object({
  token: zPrimitive.str,
  userId: zPrimitive.num,
  createdAt: zPrimitive.date,
  expiresAt: zPrimitive.date,
})

export type UserSessionDto = z.infer<typeof UserSessionDto>

export const SessionDataDto = z.object({
  userId: zPrimitive.num,
  email: zPrimitive.email,
  username: zPrimitive.str,
})

export type SessionDataDto = z.infer<typeof SessionDataDto>

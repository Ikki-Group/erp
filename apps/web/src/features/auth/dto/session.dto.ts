import z from 'zod'

import { zDate, zEmail, zId, zStr } from '@/lib/validation'

export const SessionDto = z.object({ id: zId, userId: zId, createdAt: zDate, expiredAt: zDate })

export type SessionDto = z.infer<typeof SessionDto>

export const SessionPayloadDto = z.object({ id: zId, userId: zId, email: zEmail, username: zStr })

export type SessionPayloadDto = z.infer<typeof SessionPayloadDto>

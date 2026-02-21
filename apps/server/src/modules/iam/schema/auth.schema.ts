import z from 'zod'

import { UserWithAccessDto } from './user.schema'

/* ─── Request ───────────────────────────────────────────── */

export const LoginDto = z
  .object({
    identifier: z.string().describe('Email or Username'),
    password: z.string(),
  })
  .meta({
    example: {
      identifier: 'admin@ikki.dev',
      password: 'admin123',
    },
  })

export type LoginDto = z.infer<typeof LoginDto>

/* ─── Response ──────────────────────────────────────────── */

export const AuthResponseDto = z.object({
  user: UserWithAccessDto,
  token: z.string(),
})

export type AuthResponseDto = z.infer<typeof AuthResponseDto>

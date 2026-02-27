import z from 'zod'

export const AuthResponseDto = z.object({
  token: z.string(),
})

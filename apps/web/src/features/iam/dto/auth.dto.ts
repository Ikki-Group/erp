import z from 'zod'
import { UserSelectDto } from './user.dto'

export const AuthResponseDto = z.object({
  token: z.string(),
  user: UserSelectDto,
})

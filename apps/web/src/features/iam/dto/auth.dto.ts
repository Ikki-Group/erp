import z from 'zod'
import { UserDetailDto } from '../dto'

export const AuthResponseDto = z.object({
  token: z.string(),
  user: UserDetailDto,
})

import { z, zc, zp } from '@ikki/api-contract/validation'

import { UserDetailDto } from '@/modules/iam/user/user.dto'

export const AuthLoginDto = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type AuthLoginDto = z.infer<typeof AuthLoginDto>

export const AuthOutputDto = z.object({
	user: UserDetailDto,
	token: zp.str,
})
export type AuthOutputDto = z.infer<typeof AuthOutputDto>

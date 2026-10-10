import type { LoginResponseDto, MeResponseDto } from '@ikki/contract/auth'

export { LoginDto, LoginResponseDto, MeResponseDto } from '@ikki/contract/auth'

export type AuthUser = LoginResponseDto['user']
export type AuthLocation = MeResponseDto['locations'][number]

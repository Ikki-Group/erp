import { useSuspenseQuery } from '@tanstack/react-query'
import type { UserDetailDto } from '@/features/iam/dto'
import { authApi } from '@/features/iam'

export function useUser(): UserDetailDto {
  const { data } = useSuspenseQuery(authApi.me.query({}))
  return data.data
}

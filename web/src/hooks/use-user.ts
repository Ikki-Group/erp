import { useSuspenseQuery } from '@tanstack/react-query'
import type { UserOutputDto } from '@/features/iam'
import { authApi } from '@/features/auth'

export function useUser(): UserOutputDto {
  const { data } = useSuspenseQuery(authApi.me.query({}))
  return data.data
}

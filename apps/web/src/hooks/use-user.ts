import { useSuspenseQuery } from '@tanstack/react-query'
import type { UserSelectDto } from '@/features/iam/dto'
import { authApi } from '@/features/iam'

export function useUser(): UserSelectDto {
  const { data } = useSuspenseQuery(authApi.me.query({}))
  return data.data
}

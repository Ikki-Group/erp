import { useSuspenseQuery } from '@tanstack/react-query'

import { authApi } from '@/features/auth'
import type { UserSelectDto } from '@/features/iam'

export function useUser(): UserSelectDto {
  const { data } = useSuspenseQuery(authApi.me.query({}))
  return data.data
}

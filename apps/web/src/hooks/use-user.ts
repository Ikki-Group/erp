import { useSuspenseQuery } from '@tanstack/react-query'

import { authApi } from '@/features/auth'
import type { UserOutputDto } from '@/features/iam'

export function useUser(): UserOutputDto {
  const { data } = useSuspenseQuery(authApi.me.query({}))
  return data.data
}

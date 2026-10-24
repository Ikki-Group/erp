import { useSuspenseQuery } from '@tanstack/react-query'

import { authApi } from '@/features/auth'
import type { UserDetailDto } from '@/features/iam'

export function useUser(): UserDetailDto {
	const { data } = useSuspenseQuery(authApi.me.query({}))
	return data.data
}

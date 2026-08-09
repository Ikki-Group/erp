import { QueryClient } from '@tanstack/react-query'

import { IS_DEV } from '@/config/constant.ts'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			refetchOnMount: true,
			refetchOnWindowFocus: true,
			staleTime: 3 * 60 * 1000,
			throwOnError: IS_DEV,
		},
	},
})

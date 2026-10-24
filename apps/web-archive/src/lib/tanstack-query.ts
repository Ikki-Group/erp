import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'
import { QueryClient } from '@tanstack/react-query'

import { APP_VERSION, IS_DEV } from '@/config/constant'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			refetchOnMount: true,
			refetchOnWindowFocus: true,
			// staleTime: Infinity,
			staleTime: 3 * 60 * 1000,
			throwOnError: IS_DEV,
			experimental_prefetchInRender: true,
		},
	},
})

broadcastQueryClient({ queryClient, broadcastChannel: APP_VERSION })

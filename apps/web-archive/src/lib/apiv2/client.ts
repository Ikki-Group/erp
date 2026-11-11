import ky, { type KyInstance } from 'ky'

import { API_URL } from '@/config/constant'
import { useAppState } from '@/hooks/use-app-state'

/**
 * Standalone HTTP client for apiv2.
 *
 * Deliberately self-contained (no dependency on `@/lib/api`) so this module
 * can be adopted incrementally and the legacy `lib/api` tree can eventually
 * be deleted without touching apiv2.
 */
export const httpClient: KyInstance = ky.create({
	prefixUrl: API_URL,
	retry: 0,
	headers: { 'X-Platform': 'web' },
	hooks: {
		beforeRequest: [
			(request) => {
				const token = useAppState.getState().token
				if (token) request.headers.set('Authorization', `Bearer ${token}`)
			},
		],
	},
})

export type ApiClient = KyInstance

import ky, { type KyInstance } from 'ky'

import { API_URL } from '@/config/constant'
import { useAppState } from '@/hooks/use-app-state'

const apiClient = ky.create({
	prefixUrl: API_URL,
	headers: { 'X-Platform': 'web' },
	hooks: {
		beforeRequest: [
			(req) => {
				const token = useAppState.getState().token
				if (token) {
					req.headers.set('Authorization', `Bearer ${token}`)
				}
			},
		],
	},
	retry: 0,
})

export type ApiClient = KyInstance
export { apiClient }

import ky from 'ky'

import { API_URL } from '@/config/constant'
import { useAppState } from '@/hooks/use-app-state'

const apiClient = ky.create({
  prefixUrl: API_URL,
  headers: {
    'X-Platform': 'web',
    'X-Creator-Mail': 'rizqynugroho88@gmail.com',
  },
  hooks: {
    beforeRequest: [
      req => {
        const token = useAppState.getState().token
        if (token) {
          req.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
  retry: {
    methods: ['get'],
  },
})

export { apiClient }

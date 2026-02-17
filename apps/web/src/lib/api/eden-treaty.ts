import { API_URL } from '@/config/constant'
import { treaty } from '@elysiajs/eden'
import type { App } from '@server/app'
import { useAuth } from '../auth'

const appApi = treaty<App>(API_URL, {
  throwHttpError: true,
  onRequest(_path, options) {
    const token = useAuth.getState().token

    if (token) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${token}`)
      options.headers = headers
    }
  },
})

export { appApi }

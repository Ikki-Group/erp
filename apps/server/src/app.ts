import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/core/http/auth-plugin'
import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'
import { otel } from '@/core/otel'

import type { Modules } from './modules/_registry'

export function createApp(m: Modules): Elysia {
	const app = new Elysia({ precompile: true })

	app
		.use(errorHandler)
		.use(otel)
		.use(requestIdPlugin())
		.use(cors())
		.use(createAuthPlugin(m.auth))
		.get('/', () => ({ status: 'ok', name: 'Ikki ERP API' }))

	return app
}

import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { logger } from '@/infra/logger'
import { otel } from '@/infra/otel/otel'
import { errorHandler } from '@/server/handlers/error.handler'
import { createAuthPlugin } from '@/server/plugins/auth.plugin'
import { requestIdPlugin } from '@/server/plugins/request-id.plugin'

import type { Modules } from './modules/_registry'

export function createApp(m: Modules): Elysia {
	const app = new Elysia({ precompile: true })

	app
		.use(errorHandler)
		.use(otel)
		.use(requestIdPlugin())
		.use(cors())
		.use(createAuthPlugin(m.auth))
		.get('/', () => {
			logger.info('Ikki ERP API is running')
			return { status: 'ok', name: 'Ikki ERP API' }
		})

	return app
}

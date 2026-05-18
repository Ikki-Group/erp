import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'

import type { Modules } from './modules/_registry'
import { logger } from '@/infra/logger'
import { otel } from '@/infra/otel/otel'

export function createApp(m: Modules): Elysia {
	const app = new Elysia({ precompile: true })

	app
		.use(errorHandler)
		.use(otel)
		.use(requestIdPlugin())
		.use(cors())
		// .use(createAuthPlugin(m.auth))
		.get('/', () => {
			logger.info('Ikki ERP API is running')
			return { status: 'ok', name: 'Ikki ERP API' }
		})

	return app
}

import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/core/http/auth-plugin'
import { HttpError } from '@/core/http/errors'
import { requestIdPlugin } from '@/core/http/request-id'
import { logger } from '@/core/logger'
import { otel } from '@/core/otel'
import { createModules } from '@/modules/_registry'
import { createRoutes } from '@/modules/_routes'

// Initialize core modules
const m = createModules()
const routes = createRoutes(m)

export const app = new Elysia({ precompile: true })
	.use(otel)
	.use(requestIdPlugin())
	.use(cors())
	.use(createAuthPlugin(m.auth))
	.error({
		HTTP_ERROR: HttpError,
	})
	.onError(({ code, error, set }) => {
		let stack = ''
		if (error instanceof Error) {
			stack = error.stack ?? 'Unknown'
		}

		if (code === 'VALIDATION') {
			set.status = 422
			return {
				status: 'error',
				code: 'VALIDATION_ERROR',
				message: 'Validation failed',
				errors: error.all,
				stack,
			}
		}

		if (error instanceof HttpError) {
			set.status = error.statusCode
			return { status: 'error', code: error.code, message: error.message, stack }
		}

		logger.error(error)
		set.status = 500
		return {
			status: 'error',
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Internal server error',
			stack,
		}
	})
	.get('/', () => ({ status: 'ok', name: 'Ikki ERP API' }))

// Register module routes
routes.forEach((route) => app.use(route))

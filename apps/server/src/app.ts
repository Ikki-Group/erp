import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/core/http/auth-plugin'
import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'
import { otel } from '@/core/otel'

import { createModules } from '@/modules/_registry'
import { createRoutes } from '@/modules/_routes'

// Initialize core modules
const m = createModules()
const routes = createRoutes(m)

export const app = new Elysia({ precompile: true })
	.use(errorHandler)
	.use(otel)
	.use(requestIdPlugin())
	.use(cors())
	.use(createAuthPlugin(m.auth))
	.get('/', () => ({ status: 'ok', name: 'Ikki ERP API' }))

// Register module routes
routes.forEach((route) => app.use(route))

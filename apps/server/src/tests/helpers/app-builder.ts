import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'

import { createMockAuthPlugin, mockAuthenticatedUser } from './auth'

/**
 * Creates a test app instance with mocked auth for HTTP integration tests.
 * This creates a minimal app with just the route under test.
 */
export function createTestApp(
	route: ((app: Elysia) => Elysia) | Elysia,
	options: { user?: typeof mockAuthenticatedUser } = {},
) {
	const app = new Elysia()
		.use(errorHandler)
		.use(requestIdPlugin())
		.use(cors())
		.use(createMockAuthPlugin(options.user ?? mockAuthenticatedUser))

	return app.use(route)
}

/**
 * Creates a test app with optional authentication.
 * Simplified version for backward compatibility.
 */
export function createRouteTestApp(
	route: (app: Elysia) => Elysia,
	options: { authenticated?: boolean } = { authenticated: true },
) {
	const app = new Elysia()
	app.use(errorHandler)
	app.use(requestIdPlugin())
	app.use(cors())

	if (options.authenticated !== false) {
		app.use(createMockAuthPlugin())
	}

	return app.use(route)
}

/**
 * Helper to make JSON requests in tests
 */
export function jsonRequest(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	path: string,
	body?: unknown,
): Request {
	const url = new URL(path, 'http://localhost').toString()
	return new Request(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	})
}

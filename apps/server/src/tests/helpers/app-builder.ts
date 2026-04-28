import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'
import { requestIdPlugin } from '@/core/http/request-id'

import { initModules } from '@/modules/_registry'
import { initRoutes } from '@/modules/_routes'

import { createMockAuthPlugin, mockAuthenticatedUser, MockAuthService } from './auth'
import { getTestDatabase } from './db'
import { createApp } from '@/app'

/**
 * Creates a minimal test app with mocked auth for unit tests.
 * Fast and focused - use for testing individual routes/components.
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
 * Creates a full integration test app using real module registry.
 * Use for realistic integration testing - slower but authentic.
 */
export function createIntegrationTestApp() {
	const db = getTestDatabase()
	const modules = initModules(db)
	const routes = initRoutes(modules)

	const app = createApp(modules)
	routes.register(app)

	return app
}

/**
 * Creates an integration test app with mock auth service.
 * Use for happy path tests without requiring database sessions.
 */
export function createIntegrationTestAppWithMockAuth() {
	const db = getTestDatabase()
	const modules = initModules(db)
	const routes = initRoutes(modules)

	// Replace auth service with mock
	const mockAuthService = new MockAuthService()
	modules.auth = mockAuthService as any

	const app = createApp(modules)
	routes.register(app)

	return app
}

/**
 * Helper to make JSON requests in tests
 */
export function jsonRequest(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	path: string,
	body?: unknown,
	headers?: Record<string, string>,
): Request {
	const url = new URL(path, 'http://localhost').toString()
	return new Request(url, {
		method,
		headers: { 'Content-Type': 'application/json', ...headers },
		body: body ? JSON.stringify(body) : undefined,
	})
}

/**
 * Helper to make authenticated JSON requests in tests
 */
export function authenticatedJsonRequest(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	path: string,
	token: string,
	body?: unknown,
): Request {
	return jsonRequest(method, path, body, {
		Authorization: `Bearer ${token}`,
	})
}

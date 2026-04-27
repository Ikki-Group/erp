import { Elysia } from 'elysia'

import { errorHandler } from '@/core/http/error-handler'

import { createMockAuthPlugin } from './auth'

export function createRouteTestApp(
	route: (app: Elysia) => Elysia,
	options: { authenticated?: boolean } = { authenticated: true },
) {
	const app = new Elysia()
	app.use(errorHandler)

	if (options.authenticated !== false) {
		app.use(createMockAuthPlugin())
	}

	return app.use(route)
}

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

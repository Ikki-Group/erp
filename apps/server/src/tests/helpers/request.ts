/**
 * Typed request helpers for integration tests.
 * Sends requests through Elysia's app.handle() — no network, no .listen().
 */
import { testApp } from './app.ts'

// ─── Types ───

type RequestOptions = {
	body?: unknown
	cookie?: string
	query?: Record<string, string>
}

// ─── Helpers ───

function buildUrl(path: string, query?: Record<string, string>): string {
	const url = new URL(path, 'http://localhost')
	if (query) {
		for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
	}
	return url.toString()
}

function buildHeaders(opts: RequestOptions): Record<string, string> {
	const headers: Record<string, string> = {}
	if (opts.cookie) headers['cookie'] = opts.cookie
	return headers
}

// ─── Request Methods ───

export async function GET(path: string, opts: RequestOptions = {}): Promise<Response> {
	return testApp.handle(
		new Request(buildUrl(path, opts.query), {
			method: 'GET',
			headers: buildHeaders(opts),
		}),
	)
}

export async function POST(path: string, opts: RequestOptions = {}): Promise<Response> {
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		...buildHeaders(opts),
	}
	return testApp.handle(
		new Request(buildUrl(path, opts.query), {
			method: 'POST',
			headers,
			body: opts.body ? JSON.stringify(opts.body) : undefined,
		}),
	)
}

export async function PUT(path: string, opts: RequestOptions = {}): Promise<Response> {
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		...buildHeaders(opts),
	}
	return testApp.handle(
		new Request(buildUrl(path, opts.query), {
			method: 'PUT',
			headers,
			body: opts.body ? JSON.stringify(opts.body) : undefined,
		}),
	)
}

export async function DELETE(path: string, opts: RequestOptions = {}): Promise<Response> {
	return testApp.handle(
		new Request(buildUrl(path, opts.query), {
			method: 'DELETE',
			headers: buildHeaders(opts),
		}),
	)
}

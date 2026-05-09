// oxlint-disable typescript/no-unsafe-type-assertion
// oxlint-disable typescript/no-misused-spread

import type { TokenStore } from './token-store'
import type { Elysia } from 'elysia'

// type ApiResponse<T = any> = {
// 	success: true,
// 	code: string,
// } | {
// 	success: false,
// 	example: string
// }

export class TestClient {
	constructor(
		private readonly app: Elysia,
		private readonly baseUrl: string,
		private readonly defaultHeaders: Record<string, string> = {},
		private readonly tokenStore?: TokenStore,
	) {}

	as(label: string): TestClient {
		if (!this.tokenStore) {
			throw new Error('TokenStore not initialized in TestClient')
		}

		const authData = this.tokenStore.get(label)
		if (!authData) {
			throw new Error(`No token found for label: ${label}`)
		}

		return this.withAuth(authData.token)
	}

	withAuth(token: string): TestClient {
		return new TestClient(
			this.app,
			this.baseUrl,
			{
				...this.defaultHeaders,
				authorization: `Bearer ${token}`,
			},
			this.tokenStore,
		)
	}

	#request(method: string, path: string, opts?: RequestInit): Promise<Response> {
		const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
		return this.app.handle(
			new Request(url, {
				method,
				...opts,
				headers: {
					...this.defaultHeaders,
					...opts?.headers,
				},
			}),
		)
	}

	async toJsonResponse<T = any>(res: Response): Promise<T> {
		return (await res.json()) as T
	}

	async get(path: string, opts?: RequestInit): Promise<Response> {
		return this.#request('GET', path, opts)
	}

	async post(path: string, body: unknown, opts?: RequestInit): Promise<Response> {
		const res = await this.#request('POST', path, {
			...opts,
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json',
				...opts?.headers,
			},
		})
		return res
	}

	async put(path: string, body: unknown, opts?: RequestInit): Promise<Response> {
		const res = await this.#request('PUT', path, {
			...opts,
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json',
				...opts?.headers,
			},
		})
		return res
	}

	async del(path: string, body?: unknown, opts?: RequestInit): Promise<Response> {
		const res = await this.#request('DELETE', path, {
			...opts,
			body: body ? JSON.stringify(body) : undefined,
			headers: {
				'content-type': 'application/json',
				...opts?.headers,
			},
		})
		return res
	}
}

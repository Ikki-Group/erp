// oxlint-disable typescript/no-unsafe-type-assertion
// oxlint-disable typescript/no-misused-spread

import type { Elysia } from 'elysia'

export class TestClient {
	constructor(
		private readonly app: Elysia,
		private readonly baseUrl: string,
	) {}

	#request(method: string, path: string, opts?: RequestInit): Promise<Response> {
		const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`
		return this.app.handle(
			new Request(url, {
				method,
				...opts,
				headers: {
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

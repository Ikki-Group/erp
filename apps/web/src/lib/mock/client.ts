// oxlint-disable-next-line import/no-unassigned-import
import './routes/index.ts'
import type { ApiClient } from '@/lib/api/client.ts'

import { mockFetch } from './router.ts'

/**
 * Mock `ApiClient` — same call signature as the real `httpClient`
 * (`(url, init) => Promise<Response>`), backed by `mockFetch` instead of
 * the network. Swapped in by `@/lib/api/client.ts` when `IS_MOCK_API` is
 * true; every `defineQuery`/`defineMutation`/`defineResource` call is
 * unaware of the difference.
 */
export function createMockClient(): ApiClient {
	const client = (url: string, init?: RequestInit): Promise<Response> => mockFetch(url, init)
	Object.defineProperty(client, 'baseUrl', { value: 'mock://api', writable: false })
	return client as ApiClient
}

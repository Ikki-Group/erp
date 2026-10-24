/**
 * A single mocked route handler. Receives the parsed query string and the
 * already-validated JSON body (validated against the endpoint's Zod schema
 * *before* it reaches the transport — see `createCoreFetch` in
 * `@/lib/api/endpoint.ts`), and returns a `Response` shaped like the real
 * API's envelope (`{ success, code, data }` / `{ code, message }`).
 */
export type MockRouteHandler = (
	params: URLSearchParams,
	body?: unknown,
) => Response | Promise<Response>

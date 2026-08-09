# API Layer

HTTP client, endpoint registry, and the `defineQuery`/`defineMutation`/`defineResource` factory system. Ported from `web-archive/src/lib/apiv2/` with `ky` replaced by native fetch.

> **Status:** Blueprint. The API layer has not been ported yet. Source reference lives in `apps/web-archive/src/lib/apiv2/`. Install `@tanstack/react-query` and `zod` before building this layer (see `01-architecture.md`).

## Overview

```
┌──────────────────────────────────────────────────────────┐
│  Feature (api.ts)                                         │
│  defineQuery / defineMutation / defineResource            │
└────────────────────────┬─────────────────────────────────┘
                         │ uses
┌────────────────────────▼─────────────────────────────────┐
│  lib/api/endpoint.ts                                      │
│  Core fetch logic, Zod validation, query key generation   │
└────────────────────────┬─────────────────────────────────┘
                         │ calls
┌────────────────────────▼─────────────────────────────────┐
│  lib/api/http.ts                                          │
│  requestJson() — native fetch wrapper                     │
└────────────────────────┬─────────────────────────────────┘
                         │ uses
┌────────────────────────▼─────────────────────────────────┐
│  lib/api/client.ts                                        │
│  Configured fetch instance (base URL, credentials, etc.)  │
└──────────────────────────────────────────────────────────┘
```

## HTTP Client (`lib/api/client.ts`)

A thin wrapper around native `fetch` that handles base URL, credentials, and default headers.

```ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function apiClient(url: string, init?: RequestInit): Promise<Response> {
	const fullUrl = `${API_URL}/${url}`

	const response = await fetch(fullUrl, {
		...init,
		credentials: 'include', // session cookie auto-sent
		headers: {
			'Content-Type': 'application/json',
			'X-Platform': 'web',
			...init?.headers,
		},
	})

	return response
}
```

Key behaviors:

- `credentials: 'include'` — session cookie sent on every request.
- `X-Platform: web` — identifies the client to the server.
- No token management — auth is entirely cookie-based.
- `signal` forwarded for React Query abort-on-unmount.

## Request Function (`lib/api/http.ts`)

Low-level function that performs the request and normalizes errors.

```ts
export interface RequestConfig {
	method: HttpMethod
	url: string
	query?: Record<string, unknown>
	body?: unknown
	signal?: AbortSignal
}

export async function requestJson<T = unknown>(config: RequestConfig): Promise<T> {
	// 1. Build URL with query params
	// 2. Call apiClient with method, body, signal
	// 3. Handle HTTP errors → throw ApiError
	// 4. Handle network errors / timeouts
	// 5. Preserve AbortError for React Query cancellation
	// 6. Parse JSON response
	return json as T
}
```

### Error Normalization

All errors become `ApiError` instances with structured data:

```ts
class ApiError extends Error {
	status?: number
	code?: string
	data?: unknown

	static fromPayload(payload: ApiErrorPayload, status: number): ApiError
}
```

Server error responses (`4xx`/`5xx` with JSON body) are parsed into `ApiError`. Network failures, timeouts, and `AbortError` (query cancellation) are handled distinctly.

## Endpoint Registry (`config/endpoint.ts`)

A single flat object mapping all API endpoint URLs. This is the only place URLs are defined — features reference this, never inline strings.

```ts
export const endpoint = {
	auth: {
		login: 'auth/login',
		logout: 'auth/logout',
		me: 'auth/me',
		switchLocation: 'auth/switch-location',
	},
	location: {
		list: 'locations',
		detail: 'locations/detail',
		create: 'locations',
		update: 'locations',
		remove: 'locations',
	},
	material: {
		list: 'materials',
		detail: 'materials/detail',
		create: 'materials',
		update: 'materials',
		remove: 'materials',
	},
	// ... one entry per server endpoint
}
```

### Why URL-Anchored Query Keys

Query keys are built from the endpoint URL: `[url, args ?? null]`. This means any feature can invalidate another feature's cache by referencing the URL string from `config/endpoint.ts` — no circular imports.

```ts
// In inventory mutation, invalidate material list:
invalidates: [endpoint.material.list]
```

## Endpoint Factories

### `defineQuery`

For read endpoints (GET or POST-as-search). Returns a `QueryEndpoint` with:

- `.fetch(args, signal)` — raw fetch
- `.queryKey(args)` — branded query key (type-safe `getQueryData`)
- `.queryOptions(args, overrides?)` — spread into `useQuery`/`useSuspenseQuery`

```ts
import { defineQuery } from '@/lib/api'
import { createPaginatedResponseSchema } from '@/lib/validation'
import { endpoint } from '@/config/endpoint'
import { LocationSelectDto, LocationFilterDto } from './dto'

export const locationList = defineQuery({
	method: 'get',
	url: endpoint.location.list,
	query: LocationFilterDto,
	result: createPaginatedResponseSchema(LocationSelectDto),
})

// Usage in component:
const { data } = useQuery(locationList.queryOptions({ page: 1, limit: 20 }))

// Usage in route loader:
await queryClient.ensureQueryData(locationList.queryOptions({ page: 1, limit: 20 }))
```

### `defineMutation`

For write endpoints. Returns a `MutationEndpoint` with:

- `.fetch(args, signal)` — raw fetch (includes awaited invalidation)
- `.mutationOptions(overrides?)` — spread into `useMutation`

```ts
import { defineMutation } from '@/lib/api'
import { createSuccessResponseSchema, zc } from '@/lib/validation'
import { endpoint } from '@/config/endpoint'
import { CreateLocationDto } from './dto'

export const locationCreate = defineMutation({
	method: 'post',
	url: endpoint.location.create,
	body: CreateLocationDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [endpoint.location.list],
})

// Usage:
const mutation = useMutation(locationCreate.mutationOptions())
mutation.mutate({ name: 'Ikki Resto', code: 'RESTO-01', type: 'store' })
```

### Auto-Invalidation

Mutations declare `invalidates` — an array of query keys to invalidate on success. The invalidation is **awaited** so the UI shows fresh data immediately after the mutation completes.

```ts
invalidates: [
	endpoint.location.list, // static key
	(args, result) => [endpoint.location.detail, { id: result.id }], // dynamic
]
```

Targets can be:

- A string (auto-wrapped as `[string]`) — matches any query whose key starts with that URL
- A `QueryKey` array — exact match
- A function `(args, result) => string | QueryKey` — dynamic, resolved post-mutation

### `defineResource`

CRUD sugar that wires up `list`/`detail`/`create`/`update`/`remove` in one call with pre-wired invalidation.

```ts
import { defineResource } from '@/lib/api'
import { endpoint } from '@/config/endpoint'
import { LocationSelectDto, CreateLocationDto, UpdateLocationDto } from './dto'

export const locationResource = defineResource({
	urls: {
		list: endpoint.location.list,
		detail: endpoint.location.detail,
		create: endpoint.location.create,
		update: endpoint.location.update,
		remove: endpoint.location.remove,
	},
	entitySchema: LocationSelectDto,
	filter: LocationFilterDto,
	create: CreateLocationDto,
	update: UpdateLocationDto,
})

// Returns:
// locationResource.list    → QueryEndpoint (paginated)
// locationResource.detail  → QueryEndpoint (single entity)
// locationResource.create  → MutationEndpoint (invalidates list)
// locationResource.update  → MutationEndpoint (invalidates list + detail)
// locationResource.remove  → MutationEndpoint (invalidates list)
// locationResource.keys    → { lists(), list(q), details(), detail(q) }
```

## Validation

All three boundaries are validated with Zod:

1. **Query params** — before sending (catch bad input early)
2. **Request body** — before sending
3. **Response** — after receiving (catch server contract drift)

In development, validation failures log a detailed tree (schema diff, raw data, error path). In production, response validation can be relaxed for performance.

```ts
// Dev-only error logging
[api] Response validation failed → locations
  📋 Error Path: data.items.0.type
  ❌ Error Message: Invalid enum value
  🌳 Zod Tree: ...
  📦 Raw Data: { ... }
```

## Shared Validation Schemas (`lib/validation/`)

Reusable schema helpers matching server conventions:

```ts
// Common field schemas
export const zc = {
	RecordId: z.object({ id: z.coerce.number().int().positive() }),
	strTrim: z.string().trim().min(1),
	// ...
}

// Query param helpers
export const zq = {
	pagination: z.object({
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(100).default(20),
	}),
}

// Response envelope wrappers
export function createSuccessResponseSchema<T extends ZodType>(dataSchema: T) {
	return z.object({ success: z.literal(true), data: dataSchema })
}

export function createPaginatedResponseSchema<T extends ZodType>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		data: z.object({
			items: z.array(itemSchema),
			total: z.number(),
			page: z.number(),
			limit: z.number(),
		}),
	})
}
```

## Complete Feature Example

```ts
// features/location/dto/location.dto.ts
import { z } from 'zod'

export const LocationSelectDto = z.object({
	id: z.number(),
	code: z.string(),
	name: z.string(),
	type: z.enum(['store', 'warehouse']),
	isActive: z.number(),
})
export type LocationSelectDto = z.infer<typeof LocationSelectDto>

export const LocationFilterDto = z.object({
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
	search: z.string().optional(),
	type: z.enum(['store', 'warehouse']).optional(),
})

export const CreateLocationDto = z.object({
	code: z.string().trim().min(1),
	name: z.string().trim().min(1),
	type: z.enum(['store', 'warehouse']),
})

export const UpdateLocationDto = CreateLocationDto.extend({
	id: z.number(),
})
```

```ts
// features/location/api.ts
import { defineResource } from '@/lib/api'
import { endpoint } from '@/config/endpoint'
import { LocationSelectDto, LocationFilterDto, CreateLocationDto, UpdateLocationDto } from './dto'

export const locationApi = defineResource({
	urls: endpoint.location,
	entitySchema: LocationSelectDto,
	filter: LocationFilterDto,
	create: CreateLocationDto,
	update: UpdateLocationDto,
})
```

---

**Next:** [04-state-management.md](./04-state-management.md) — Auth context, location context, and server state patterns.

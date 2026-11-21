import type { QueryKey } from './types.ts'

/**
 * Standardized React Query key builder for a `feature`/`resource` pair.
 *
 * Prefer the default URL-anchored `queryKey` (`[url, args ?? null]`, see
 * `defineQuery`/`defineMutation`/`defineResource`) whenever an endpoint has
 * a natural single URL.
 *
 * Reach for `createQueryKeys` only when there's no single natural URL to
 * anchor on — e.g. a derived/aggregated cache entry backed by multiple
 * endpoints.
 */
export function createQueryKeys(feature: string, resource: string) {
	const root = [feature, resource] as const

	return {
		root,
		all: () => [...root] as QueryKey,
		lists: () => [...root, 'list'] as QueryKey,
		list: (params?: unknown) => [...root, 'list', params ?? null] as QueryKey,
		details: () => [...root, 'detail'] as QueryKey,
		detail: (id: unknown) => [...root, 'detail', id ?? null] as QueryKey,
		custom: (...parts: readonly unknown[]) => [...root, ...parts] as QueryKey,
	}
}

export type QueryKeys = ReturnType<typeof createQueryKeys>

import type { QueryKey } from './types'

/**
 * Standardized React Query key builder for a `feature`/`resource` pair,
 * following the widely-used "query key factory" convention
 * (root → all → lists/list → details/detail → custom).
 *
 * Prefer the default URL-anchored `queryKey` (`[url, args ?? null]`, see
 * `defineQuery`/`defineMutation`/`defineResource`) whenever an endpoint has
 * a natural single URL — it lets *any* feature invalidate it with just the
 * raw URL string from the centralized `@/config/endpoint` registry (see
 * `endpoint.ts`), with no import of this module and no cyclic-dependency
 * risk.
 *
 * Reach for `createQueryKeys` only when there's no single natural URL to
 * anchor on — e.g. a derived/aggregated cache entry backed by multiple
 * endpoints, or a purely local grouping that's never invalidated from
 * outside its own feature file.
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

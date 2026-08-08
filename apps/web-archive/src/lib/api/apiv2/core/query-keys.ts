import type { QueryKey } from './types'

type QueryKeyPart = string | number | boolean | null | undefined

/**
 * Creates a namespaced, type-safe set of React Query key builders for a
 * given `feature`/`resource` pair. Identical shape to the legacy
 * `lib/api/query-keys.ts` helper — kept here so apiv2 has no dependency
 * on the old factory files.
 */
export function createQueryKeys<const TFeature extends string, const TResource extends string>(
	feature: TFeature,
	resource: TResource,
) {
	const root = [feature, resource] as const

	return {
		root,
		all: () => root,
		lists: () => [...root, 'list'] as const,
		list: <TParams>(params?: TParams) =>
			[...root, 'list', params ?? null] as const satisfies QueryKey,
		details: () => [...root, 'detail'] as const,
		detail: (id: QueryKeyPart) => [...root, 'detail', id ?? null] as const,
		custom: <const TParts extends readonly QueryKeyPart[]>(...parts: TParts) =>
			[...root, ...parts] as const,
	}
}

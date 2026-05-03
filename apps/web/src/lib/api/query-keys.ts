type QueryKeyPart = string | number | boolean | null | undefined

export type AppQueryKey = readonly [string, ...QueryKeyPart[]]

export function createQueryKeys<const TFeature extends string, const TResource extends string>(
	feature: TFeature,
	resource: TResource,
) {
	const root = [feature, resource] as const

	return {
		root,
		all: () => root,
		lists: () => [...root, 'list'] as const,
		list: <TParams>(params?: TParams) => [...root, 'list', params ?? null] as const,
		details: () => [...root, 'detail'] as const,
		detail: (id: QueryKeyPart) => [...root, 'detail', id ?? null] as const,
		custom: <const TParts extends readonly QueryKeyPart[]>(...parts: TParts) => [...root, ...parts] as const,
	}
}

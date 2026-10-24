import { getActiveLocationId } from './active-location.ts'
import type { QueryKey } from './types.ts'

/**
 * The canonical query-key factory for the redesigned data-fetching layer.
 *
 * Every key in the app flows through here, giving one predictable structure:
 *
 *   plain:            [feature, resource, kind, params?]
 *   location-scoped:  [feature, resource, { loc }, kind, params?]
 *
 * `kind` is `'list'` or `'detail'`; `params` is the trailing filter/id object
 * (normalized to `null` when absent). Because the shape is fixed, partial-match
 * invalidation is obvious: `lists()` is a prefix of every `list(params)`.
 *
 * A **location-scoped** resource folds the active `locationId` (read via
 * `getActiveLocationId`) in right after the resource segment. This partitions
 * the cache per location — location 1's stock list and location 2's are
 * distinct entries, so switching back is instant — and makes the location
 * segment a precise invalidation target when the active location changes.
 * The `{ loc }` object sits *before* `kind` so that `lists()`/`details()`
 * prefixes stay location-scoped too.
 */

export interface CreateResourceKeysOptions {
	/**
	 * When true, the active `locationId` is folded into every key so caches
	 * partition per location. Use for data the server scopes to the active
	 * location; leave off for global reference data.
	 */
	locationScoped?: boolean
}

export interface ResourceKeys {
	/** `[feature, resource]` (+ `{ loc }` when scoped) — the broadest prefix. */
	all: () => QueryKey
	/** List prefix — a prefix of every `list(params)`, for invalidating all lists. */
	lists: () => QueryKey
	/** A specific list key including its filter params. */
	list: (params?: unknown) => QueryKey
	/** Detail prefix — a prefix of every `detail(params)`. */
	details: () => QueryKey
	/** A specific detail key including its id/params. */
	detail: (params?: unknown) => QueryKey
}

export function createResourceKeys(
	feature: string,
	resource: string,
	options: CreateResourceKeysOptions = {},
): ResourceKeys {
	const { locationScoped = false } = options

	/** `[feature, resource]`, plus the `{ loc }` segment for a scoped resource. */
	const base = (): unknown[] => {
		const root: unknown[] = [feature, resource]
		if (locationScoped) root.push({ loc: getActiveLocationId() })
		return root
	}

	return {
		all: () => base() as QueryKey,
		lists: () => [...base(), 'list'] as QueryKey,
		list: (params?: unknown) => [...base(), 'list', params ?? null] as QueryKey,
		details: () => [...base(), 'detail'] as QueryKey,
		detail: (params?: unknown) => [...base(), 'detail', params ?? null] as QueryKey,
	}
}

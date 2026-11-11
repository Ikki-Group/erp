import type { UseQueryOptions, UseSuspenseQueryOptions } from '@tanstack/react-query'

/**
 * Adapt an endpoint's `queryOptions(...)` for `useSuspenseQuery`.
 *
 * TanStack Query types `UseQueryOptions` and `UseSuspenseQueryOptions` as
 * nominally distinct (the suspense variant forbids `enabled`, `placeholderData`,
 * etc.), so the factory's `queryOptions` output — an `UseQueryOptions` — isn't
 * directly assignable to `useSuspenseQuery`, even though the runtime object
 * (just `queryKey` + `queryFn` + freshness) is exactly what suspense needs.
 *
 * This is the single, documented bridge: loader-backed components prefetch via
 * `ensureQueryData(endpoint.queryOptions(args))` (which accepts the plain
 * options) and read with `useSuspenseQuery(suspenseOptions(endpoint.queryOptions(args)))`.
 * Keeping the reinterpretation here means no per-call-site cast and one place to
 * revisit if a future RQ version unifies the two option types.
 *
 * Caveat: the cast erases the type-level ban on suspense-hostile options
 * (`enabled`, `placeholderData`, …). Only pass options that are actually
 * suspense-safe — i.e. don't thread such overrides through `queryOptions(...)`
 * before wrapping the result here.
 */
export function suspenseOptions<TData, TError, TQueryKey extends readonly unknown[]>(
	options: UseQueryOptions<TData, TError, TData, TQueryKey>,
): UseSuspenseQueryOptions<TData, TError, TData, TQueryKey> {
	return options as unknown as UseSuspenseQueryOptions<TData, TError, TData, TQueryKey>
}

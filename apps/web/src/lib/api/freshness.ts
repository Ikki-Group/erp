/**
 * Freshness tiers — the single place that answers "how fresh does this query
 * need to be?".
 *
 * Rather than sprinkle raw millisecond `staleTime`/`gcTime` numbers across
 * feature files (which drift into a dozen slightly-different magic numbers with
 * no rationale), every query opts into a named tier. The tier maps to concrete
 * TanStack Query cache options here, so changing what "standard" means is a
 * one-line edit and the intent stays greppable at each call site.
 */

const MINUTE = 60 * 1000

/** How fresh a query's data must be, expressed as intent rather than a number. */
export type FreshnessTier =
	/** Rarely-changing reference data (locations, UoM, roles, payment methods, company). */
	| 'static'
	/** The default for ordinary lists and details. Matches the prior app-wide default. */
	| 'standard'
	/**
	 * Session/auth validity (`/auth/me`). Shorter than `standard` on purpose: a
	 * session can now be invalidated out-of-band (another device revokes it via
	 * `/auth/sessions/revoke`, or a future admin force-logout — see ADR-0018 on
	 * the server), not just by natural client-side expiry. `refetchOnWindowFocus`/
	 * `refetchOnReconnect` only refetch once the cached data is stale, so this
	 * tier is what actually bounds how long a revoked session stays "valid"
	 * client-side after the next focus/reconnect.
	 */
	| 'session'
	/** Live operational data (POS active shift, order detail, stock balance). */
	| 'volatile'
	/** Always refetch — never considered fresh. */
	| 'realtime'

/** The concrete TanStack Query cache options a tier resolves to. */
export interface FreshnessOptions {
	staleTime: number
	gcTime: number
	/** Only set for tiers that poll (currently `volatile`); omitted otherwise. */
	refetchInterval?: number
}

/**
 * The canonical tier table. Numbers live here and nowhere else.
 *
 * - `static`: 10 min stale, 30 min in cache — reference data barely changes.
 * - `standard`: 3 min stale (the previous global default), 5 min gc.
 * - `session`: 45 s stale, 5 min gc — tight enough that a focus/reconnect
 *   notices a server-side revoke within a bounded window, loose enough to
 *   not hit `/auth/me` on every tab-focus flicker.
 * - `volatile`: 10 s stale + 30 s poll — operational data must stay live.
 * - `realtime`: always stale; short gc so it isn't retained needlessly.
 */
export const FRESHNESS_TIERS: Record<FreshnessTier, FreshnessOptions> = {
	static: { staleTime: 10 * MINUTE, gcTime: 30 * MINUTE },
	standard: { staleTime: 3 * MINUTE, gcTime: 5 * MINUTE },
	session: { staleTime: 45 * 1000, gcTime: 5 * MINUTE },
	volatile: { staleTime: 10 * 1000, gcTime: 5 * MINUTE, refetchInterval: 30 * 1000 },
	realtime: { staleTime: 0, gcTime: MINUTE },
}

/**
 * Resolve a tier to a fresh options object suitable for spreading into
 * `queryOptions`. Returns a new object each call so callers can never mutate
 * the shared tier table.
 */
export function resolveFreshness(tier: FreshnessTier): FreshnessOptions {
	return { ...FRESHNESS_TIERS[tier] }
}

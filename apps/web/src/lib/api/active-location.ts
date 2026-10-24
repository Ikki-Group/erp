/**
 * Ambient access to the current active location for framework-level code.
 *
 * The active location lives in React context (`location-provider.tsx`) plus
 * localStorage, which non-React modules — the endpoint/query-key factories —
 * cannot read via hooks. The location provider wires an accessor once at boot,
 * and framework code reads the live value through `getActiveLocationId()` with
 * no hook and no circular dependency between the query layer and the provider.
 *
 * `null` means the consolidated (all-locations) view — the same convention the
 * server and location provider use.
 */

let accessor: (() => number | null) | undefined

/**
 * Wire the source of truth for the active location. Called once by the
 * location provider at boot; calling it again replaces the previous accessor.
 */
export function setActiveLocationAccessor(fn: () => number | null): void {
	accessor = fn
}

/**
 * Read the current active location id, or `null` for the consolidated view
 * (also `null` before any accessor is wired). Calls the accessor each time, so
 * it always reflects the live value rather than a snapshot.
 */
export function getActiveLocationId(): number | null {
	return accessor?.() ?? null
}

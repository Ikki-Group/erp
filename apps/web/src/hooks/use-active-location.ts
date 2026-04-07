import { useAppState } from '@/hooks/use-app-state'
import { useUser } from '@/hooks/use-user'

/**
 * useActiveLocation — Global location context hook.
 *
 * Provides the currently active location for the logged-in user,
 * along with helpers for switching and checking consolidated state.
 *
 * Usage:
 * ```ts
 * const { locationId, isConsolidated, label, locations, switchTo, switchToAll } = useActiveLocation()
 * ```
 */
interface AssignmentLocation {
  location: { id: number; name: string; code?: string }
}

export function useActiveLocation() {
  const { location, setLocation } = useAppState()
  const { assignments } = useUser()

  // Deduplicate locations from assignments (a user can have multiple roles at the same location)
  const locationsMap = new Map<number, { id: number; name: string; code: string }>()
  for (const a of (assignments ?? []) as AssignmentLocation[]) {
    if (a.location && !locationsMap.has(a.location.id)) {
      locationsMap.set(a.location.id, { id: a.location.id, name: a.location.name, code: a.location.code ?? '' })
    }
  }
  const locations = Array.from(locationsMap.values())

  const hasMultiple = locations.length > 1
  const isConsolidated = hasMultiple && (location?.length ?? 0) > 1
  const activeLocationId = !isConsolidated && location?.length === 1 ? location[0] : undefined
  const activeLocation = activeLocationId ? locationsMap.get(activeLocationId) : undefined

  const label = isConsolidated
    ? `Semua Lokasi (${locations.length})`
    : activeLocation?.name ?? locations[0]?.name ?? 'Tidak ada lokasi'

  return {
    /** The single active location ID, or undefined if consolidated */
    locationId: activeLocationId,
    /** Whether user is viewing all locations at once */
    isConsolidated,
    /** Human readable label for current context */
    label,
    /** All locations available to this user */
    locations,
    /** Whether user has more than one location */
    hasMultiple,
    /** The full active location object */
    activeLocation,
    /** Switch to a single location */
    switchTo: (id: number) => { setLocation([id]) },
    /** Switch to consolidated (all locations) */
    switchToAll: () => { setLocation(locations.map((l) => l.id)) },
    /** Raw location IDs array from state */
    rawLocationIds: location,
  }
}

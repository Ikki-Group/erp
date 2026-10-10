import { createContext, useContext, useEffect, useMemo } from 'react'

import { setActiveLocationId, useActiveLocationId } from '@/lib/api/active-location.ts'

import type { AuthLocation } from '@/features/auth/dto/index.ts'

interface LocationContextValue {
	/** Currently active location, or null for "All Locations" (consolidated view). */
	activeLocation: AuthLocation | null
	isConsolidated: boolean
	/** All locations the user has access to. */
	locations: AuthLocation[]
	/** Switch the active location. Pass `null` for the consolidated view. */
	switchLocation: (locationId: number | null) => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

interface LocationProviderProps {
	children: React.ReactNode
	/** Locations the current user has access to (from /auth/me). */
	locations: AuthLocation[]
}

/**
 * Exposes the active location (held in the `active-location` store) together
 * with the user's accessible locations. Location-scoped query keys fold the
 * active id in, so switching is a natural cache partition — no invalidation.
 */
export function LocationProvider({ children, locations }: LocationProviderProps) {
	const activeId = useActiveLocationId()
	const activeLocation = locations.find((location) => location.id === activeId) ?? null

	// A persisted id the user can no longer access falls back to consolidated.
	useEffect(() => {
		if (activeId !== null && activeLocation === null) setActiveLocationId(null)
	}, [activeId, activeLocation])

	const value = useMemo<LocationContextValue>(
		() => ({
			activeLocation,
			isConsolidated: activeLocation === null,
			locations,
			switchLocation: (locationId) => {
				if (locationId === null || locations.some((l) => l.id === locationId)) {
					setActiveLocationId(locationId)
				}
			},
		}),
		[activeLocation, locations],
	)

	return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext() {
	const context = useContext(LocationContext)
	if (context === undefined) {
		throw new Error('useLocationContext must be used within a LocationProvider')
	}
	return context
}

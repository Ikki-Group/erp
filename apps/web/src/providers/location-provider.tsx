import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { setActiveLocationAccessor } from '@/lib/api/index.ts'

import { authSwitchLocationMutation } from '@/features/auth/api.ts'
import type { AuthLocation } from '@/features/auth/dto/index.ts'

// ─── Constants ───

const STORAGE_KEY = 'ikki-active-location-id'

/**
 * Guards the one-time, render-time wiring of the active-location accessor. A
 * module-level flag (not state) so it survives across the provider's renders
 * and StrictMode's double-invoke, wiring exactly once.
 */
let accessorWired = false

// ─── Context Shape ───

interface LocationContextValue {
	/** Currently active location, or null for "All Locations" (consolidated view). */
	activeLocation: AuthLocation | null
	/** Whether the user is viewing consolidated (all-location) mode. */
	isConsolidated: boolean
	/** All locations the user has access to. */
	locations: AuthLocation[]
	/** Switch the active location. Pass `null` for consolidated view. */
	switchLocation: (locationId: number | null) => Promise<void>
	/** Whether a switch is currently in-flight. */
	isSwitching: boolean
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

// ─── Provider ───

interface LocationProviderProps {
	children: React.ReactNode
	/** Locations the current user has access to (from /auth/me or login response). */
	locations: AuthLocation[]
	/** The server-side active location (from /auth/me). */
	activeLocation: AuthLocation | null
}

export function LocationProvider({ children, locations, activeLocation }: LocationProviderProps) {
	// Track local state in sync with server
	const [currentLocation, setCurrentLocation] = useState<AuthLocation | null>(activeLocation)

	// The query-key factory reads the active location at query-build time (not
	// render time) via `getActiveLocationId`, so it needs a live ref rather than
	// the closed-over `currentLocation`. Keep the ref current every render.
	const currentLocationRef = useRef(currentLocation)
	currentLocationRef.current = currentLocation

	// Wire the accessor SYNCHRONOUSLY during render (not in an effect): a child
	// route's query can build a location-scoped key on the very first commit —
	// before a parent mount effect would run — and must not read a null location
	// then. The parent renders before its children, so a render-time wire is live
	// by the time any child query builds its key. Guarded to install once.
	if (!accessorWired) {
		accessorWired = true
		setActiveLocationAccessor(() => currentLocationRef.current?.id ?? null)
	}

	// Sync from server when meQuery updates
	useEffect(() => {
		setCurrentLocation(activeLocation)
		if (activeLocation) {
			localStorage.setItem(STORAGE_KEY, String(activeLocation.id))
		} else {
			localStorage.removeItem(STORAGE_KEY)
		}
	}, [activeLocation])

	// ─── Switch mutation ───
	const switchMut = useMutation(authSwitchLocationMutation.mutationOptions())

	const switchLocation = useCallback(
		async (locationId: number | null) => {
			// Location-scoped queries fold the active `locationId` into their cache
			// key (see `createResourceKeys({ locationScoped: true })`), so switching
			// location changes those keys: the new location's data is a natural
			// cache-miss that refetches on demand, and the previous location's
			// entries stay cached for an instant switch-back. Global reference data
			// (roles, UoM, company, /auth/me) keeps its keys and is left untouched.
			// No blanket invalidation is needed — the key partitioning does the work.
			if (locationId === null) {
				setCurrentLocation(null)
				localStorage.removeItem(STORAGE_KEY)
				return
			}

			// Validate the location exists in user's allowed locations
			const target = locations.find((l) => l.id === locationId)
			if (!target) return

			const result = await switchMut.mutateAsync({ locationId })
			setCurrentLocation(result.data.activeLocation)
			localStorage.setItem(STORAGE_KEY, String(result.data.activeLocation.id))
		},
		[switchMut, locations],
	)

	const value = useMemo<LocationContextValue>(
		() => ({
			activeLocation: currentLocation,
			isConsolidated: currentLocation === null,
			locations,
			switchLocation,
			isSwitching: switchMut.isPending,
		}),
		[currentLocation, locations, switchLocation, switchMut.isPending],
	)

	return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

// ─── Hook ───

export function useLocationContext() {
	const context = useContext(LocationContext)
	if (context === undefined) {
		throw new Error('useLocationContext must be used within a LocationProvider')
	}
	return context
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authMeQuery, authSwitchLocationMutation } from '@/features/auth/api.ts'
import type { AuthLocation } from '@/features/auth/dto/index.ts'

// ─── Constants ───

const STORAGE_KEY = 'ikki-active-location-id'

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
	const queryClient = useQueryClient()

	// Track local state in sync with server
	const [currentLocation, setCurrentLocation] = useState<AuthLocation | null>(activeLocation)

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
			if (locationId === null) {
				// Consolidated view — clear local state
				// Note: server doesn't have a "clear location" endpoint,
				// so we only handle it client-side
				setCurrentLocation(null)
				localStorage.removeItem(STORAGE_KEY)
				// Invalidate all queries so they refetch without location filter
				await queryClient.invalidateQueries()
				return
			}

			// Validate the location exists in user's allowed locations
			const target = locations.find((l) => l.id === locationId)
			if (!target) return

			const result = await switchMut.mutateAsync({ locationId })
			setCurrentLocation(result.data.activeLocation)
			localStorage.setItem(STORAGE_KEY, String(result.data.activeLocation.id))

			// Invalidate all queries except /auth/me (already invalidated by mutation)
			await queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey
					return key[0] !== authMeQuery.queryKey(undefined as never)[0]
				},
			})
		},
		[switchMut, locations, queryClient],
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

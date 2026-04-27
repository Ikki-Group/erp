import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { UserDetailDto } from '@/features/iam'

type Location = Array<number> | null

interface AppState {
	token: string
	location: Location
	sidebarOpen: boolean

	invalidateSessionData: (user: UserDetailDto) => void
	isAuthenticated: () => boolean
	setToken: (token: string, user: UserDetailDto) => void
	clearToken: () => void
	setLocation: (location: Location) => void
	setSidebarOpen: (sidebarOpen: boolean) => void
}

export const useAppState = create<AppState>()(
	persist(
		(set, get) => ({
			token: '',
			location: null,
			sidebarOpen: false,

			invalidateSessionData: (user) => {
				set({ location: validateLocation(get().location, user) })
			},
			isAuthenticated: () => !!get().token,
			setToken: (token, user) => {
				set({ token, location: validateLocation(get().location, user) })
			},
			clearToken: () => set({ token: '', location: null }),
			setLocation: (location) => set({ location }),
			setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
		}),
		{ name: 'app-state', storage: createJSONStorage(() => localStorage) },
	),
)

function validateLocation(current: Location, user: UserDetailDto): Location {
	const assignments = user.assignments ?? []
	if (assignments.length === 0) return null

	const userLocationIds = assignments.map((a) => a.location.id)

	// If current selection is valid, keep it
	if (
		current &&
		current.length === 1 &&
		current[0] !== undefined &&
		userLocationIds.includes(current[0])
	) {
		return current
	}

	// Default to isDefault assignment (backend guarantees this exists)
	const defaultAssignment = assignments.find((a) => a.isDefault)
	if (defaultAssignment) return [user.defaultLocationId ?? defaultAssignment.location.id]

	// Fallback to first location
	if (userLocationIds.length > 0 && userLocationIds[0] !== undefined) return [userLocationIds[0]]
	return null
}

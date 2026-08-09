import { createContext, useCallback, useContext, useMemo } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { setOnAuthError } from '@/lib/tanstack-query.ts'

import { authLoginMutation, authLogoutMutation, authMeQuery } from '@/features/auth/api.ts'
import type { AuthLocation, AuthUser, LoginDto } from '@/features/auth/dto/index.ts'

// ─── LocalStorage Keys ───

const LOCATIONS_STORAGE_KEY = 'ikki-user-locations'

function persistLocations(locations: AuthLocation[]): void {
	localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations))
}

function loadLocations(): AuthLocation[] {
	try {
		const raw = localStorage.getItem(LOCATIONS_STORAGE_KEY)
		if (!raw) return []
		return JSON.parse(raw) as AuthLocation[]
	} catch {
		return []
	}
}

function clearLocations(): void {
	localStorage.removeItem(LOCATIONS_STORAGE_KEY)
}

// ─── Context Shape ───

interface AuthContextValue {
	user: AuthUser | null
	permissions: string[]
	isOwner: boolean
	isAuthenticated: boolean
	isLoading: boolean
	/** All locations the user has access to (persisted from login). */
	locations: AuthLocation[]
	login: (credentials: LoginDto) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─── Provider ───

interface AuthProviderProps {
	children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	// Wire global auth-error redirect (expired session → /login)
	setOnAuthError(() => {
		queryClient.clear()
		clearLocations()
		navigate({ to: '/login', replace: true })
	})

	// ─── /auth/me query ───
	const meQuery = useQuery(authMeQuery.queryOptions(undefined as never))
	const meData = meQuery.data?.data

	// ─── Login mutation ───
	const loginMut = useMutation(authLoginMutation.mutationOptions())

	const login = useCallback(
		async (credentials: LoginDto) => {
			const result = await loginMut.mutateAsync(credentials)
			// Persist locations for use after page refresh
			persistLocations(result.data.locations)
		},
		[loginMut],
	)

	// ─── Logout mutation ───
	const logoutMut = useMutation(authLogoutMutation.mutationOptions())

	const logout = useCallback(async () => {
		await logoutMut.mutateAsync(undefined as never)
		queryClient.clear()
		clearLocations()
		navigate({ to: '/login', replace: true })
	}, [logoutMut, queryClient, navigate])

	// ─── Derived state ───
	const permissions = meData?.permissions ?? []
	const isOwner = meData?.isOwner ?? false

	// Load locations from localStorage (set during login)
	const locations = useMemo(() => loadLocations(), [meData])

	const value = useMemo<AuthContextValue>(
		() => ({
			user: meData?.user ?? null,
			permissions,
			isOwner,
			isAuthenticated: !!meData?.user,
			isLoading: meQuery.isLoading,
			locations,
			login,
			logout,
		}),
		[meData, permissions, isOwner, meQuery.isLoading, locations, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ───

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

/**
 * Check if the current user has a specific permission.
 * Owners bypass all permission checks.
 */
export function useHasPermission(permission: string): boolean {
	const { permissions, isOwner } = useAuth()
	if (isOwner) return true
	return permissions.includes(permission)
}

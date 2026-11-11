import { createContext, useCallback, useContext, useMemo } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/api/client.ts'
import { setOnAuthError } from '@/lib/tanstack-query.ts'

import { toast } from '@/components/ui/toast'

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
	globalPermissions: string[]
	access: Record<string, string[]>
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

	// Wire global auth-error redirect (expired/revoked session → /login).
	// Fires from `handleGlobalError` (lib/tanstack-query.ts) on any 401/403,
	// debounced so parallel failing requests only trigger this once.
	setOnAuthError(() => {
		queryClient.clear()
		clearLocations()
		clearStoredToken()
		toast.add({
			title: 'Sesi berakhir',
			description: 'Silakan masuk kembali untuk melanjutkan.',
			type: 'warning',
		})
		// Remember where the user was so they land back there after logging in
		// again — same `redirect` search param `_authenticated`'s beforeLoad uses.
		navigate({
			to: '/login',
			replace: true,
			search: { redirect: window.location.pathname + window.location.search },
		})
	})

	// ─── /auth/me query ───
	//
	// This is the reactive session watchdog — distinct from `_authenticated`'s
	// `beforeLoad` `ensureQueryData` call, which only forces a fetch on cold
	// boot. This `useQuery` is what actually re-verifies the session on the
	// `session` freshness tier's cadence plus window-focus/reconnect, so a
	// server-side revoke (another device, or a future admin force-logout —
	// ADR-0018) gets noticed without requiring a full navigation. The two are
	// complementary, not duplicative: same query key, one network round-trip.
	const meQuery = useQuery({
		...authMeQuery.queryOptions(),
		enabled: Boolean(getStoredToken()),
		retry: false,
		throwOnError: false,
	})
	const meData = meQuery.data?.data

	// ─── Login mutation ───
	const loginMut = useMutation(authLoginMutation.mutationOptions())

	const login = useCallback(
		async (credentials: LoginDto) => {
			const result = await loginMut.mutateAsync(credentials)
			setStoredToken(result.data.token)
			persistLocations(result.data.locations)
			await queryClient.invalidateQueries({ queryKey: authMeQuery.queryKey() })
		},
		[loginMut, queryClient],
	)

	// ─── Logout mutation ───
	const logoutMut = useMutation(authLogoutMutation.mutationOptions())

	const logout = useCallback(async () => {
		try {
			await logoutMut.mutateAsync()
		} finally {
			// Always clear local state and navigate away, even if the server call
			// itself failed (e.g. the session was already dead) — "Logout" must
			// always work from the user's point of view.
			clearStoredToken()
			queryClient.clear()
			clearLocations()
			navigate({ to: '/login', replace: true })
		}
	}, [logoutMut, queryClient, navigate])

	// ─── Derived state ───
	const permissions = meData?.permissions ?? []
	const isOwner = meData?.isOwner ?? false
	const globalPermissions = meData?.globalPermissions ?? permissions
	const access = meData?.access ?? {}

	// Load locations from localStorage (set during login)
	const locations = meData?.locations ?? loadLocations()

	const value = useMemo<AuthContextValue>(
		() => ({
			user: meData?.user ?? null,
			permissions,
			isOwner,
			globalPermissions,
			access,
			isAuthenticated: !!meData?.user,
			isLoading: meQuery.isLoading,
			locations,
			login,
			logout,
		}),
		[
			meData,
			permissions,
			isOwner,
			globalPermissions,
			access,
			meQuery.isLoading,
			locations,
			login,
			logout,
		],
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

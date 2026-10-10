import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { setActiveLocationId, useActiveLocationId } from '@/lib/api/active-location.ts'
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/api/client.ts'
import { setOnAuthError } from '@/lib/tanstack-query.ts'

import { toast } from '@/components/ui/toast'

import { authLoginMutation, authLogoutMutation, authMeQuery } from '@/features/auth/api.ts'
import type { AuthLocation, AuthUser, LoginDto } from '@/features/auth/dto/index.ts'

interface AuthContextValue {
	user: AuthUser | null
	isOwner: boolean
	/** Permissions from global (location-less) assignments. */
	globalPermissions: string[]
	/** Permissions per location id. */
	access: Record<string, string[]>
	isAuthenticated: boolean
	isLoading: boolean
	/** Locations the user can work in. */
	locations: AuthLocation[]
	login: (credentials: LoginDto) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	const endSession = useCallback(() => {
		clearStoredToken()
		setActiveLocationId(null)
		queryClient.clear()
	}, [queryClient])

	// Expired/revoked session anywhere → back to /login, remembering the page.
	useEffect(() => {
		setOnAuthError(() => {
			// A failed login is not an expired session.
			if (!getStoredToken()) return
			endSession()
			toast.add({
				title: 'Sesi berakhir',
				description: 'Silakan masuk kembali untuk melanjutkan.',
				type: 'warning',
			})
			navigate({
				to: '/login',
				replace: true,
				search: { redirect: window.location.pathname + window.location.search },
			})
		})
	}, [endSession, navigate])

	// Session watchdog: re-verifies on the `session` freshness tier + focus/reconnect.
	const meQuery = useQuery({
		...authMeQuery.queryOptions(),
		enabled: Boolean(getStoredToken()),
		retry: false,
		throwOnError: false,
	})
	const me = meQuery.data?.data

	const loginMut = useMutation(authLoginMutation.mutationOptions())
	const login = useCallback(
		async (credentials: LoginDto) => {
			const result = await loginMut.mutateAsync(credentials)
			setActiveLocationId(null)
			setStoredToken(result.data.token)
			await queryClient.invalidateQueries({ queryKey: authMeQuery.queryKey() })
		},
		[loginMut, queryClient],
	)

	const logoutMut = useMutation(authLogoutMutation.mutationOptions())
	const logout = useCallback(async () => {
		try {
			await logoutMut.mutateAsync()
		} finally {
			// Logout must always work locally, even if the session was already dead.
			endSession()
			navigate({ to: '/login', replace: true })
		}
	}, [logoutMut, endSession, navigate])

	const value = useMemo<AuthContextValue>(
		() => ({
			user: me?.user ?? null,
			isOwner: me?.isOwner ?? false,
			globalPermissions: me?.globalPermissions ?? [],
			access: me?.access ?? {},
			isAuthenticated: Boolean(me?.user),
			isLoading: meQuery.isLoading,
			locations: me?.locations ?? [],
			login,
			logout,
		}),
		[me, meQuery.isLoading, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
	return context
}

/** Effective permissions in the active location (global ∪ that location's). */
export function usePermissions(): { isOwner: boolean; permissions: Set<string> } {
	const { isOwner, globalPermissions, access } = useAuth()
	const locationId = useActiveLocationId()
	return useMemo(() => {
		const local = locationId === null ? [] : (access[String(locationId)] ?? [])
		return { isOwner, permissions: new Set([...globalPermissions, ...local]) }
	}, [isOwner, globalPermissions, access, locationId])
}

/** Owners bypass all permission checks. */
export function useHasPermission(permission: string): boolean {
	const { isOwner, permissions } = usePermissions()
	return isOwner || permissions.has(permission)
}

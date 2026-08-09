import { QueryClient } from '@tanstack/react-query'

import { IS_DEV } from '@/config/constant.ts'

import { isApiError } from '@/lib/api/errors.ts'

/* -------------------------------------------------------------------------- */
/*  Auth redirect callback                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Pluggable auth-error handler. The auth module calls `setOnAuthError` once
 * at boot to wire in the actual redirect (avoids a circular dep between
 * the query client and the auth/router modules).
 */
let onAuthError: (() => void) | undefined

export function setOnAuthError(handler: () => void): void {
	onAuthError = handler
}

/* -------------------------------------------------------------------------- */
/*  Retry strategy                                                            */
/* -------------------------------------------------------------------------- */

/**
 * In dev: no retries (instant feedback).
 * In prod: retry up to 3× for transient failures only.
 *   - Never retry auth errors (401/403) — they won't self-heal.
 *   - Never retry client errors (4xx) — request is malformed.
 *   - Retry network errors and server errors (5xx) — transient.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
	if (IS_DEV) return false
	if (failureCount >= 3) return false
	if (!isApiError(error)) return true // unknown error — worth a retry
	if (error.isAuthError) return false
	if (error.isClientError) return false
	// Network errors + server errors → retry
	return true
}

/* -------------------------------------------------------------------------- */
/*  throwOnError strategy                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Controls which errors bubble to the nearest React error boundary.
 *   - Dev: throw everything → loud, immediate feedback.
 *   - Prod: throw only unrecoverable errors (network). Recoverable errors
 *     (4xx, 5xx) stay in query `error` state for per-component handling.
 */
function shouldThrowOnError(error: unknown): boolean {
	if (IS_DEV) return true
	if (isApiError(error) && error.isNetworkError) return true
	return false
}

/* -------------------------------------------------------------------------- */
/*  Global error handler                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fires on every failed mutation (and on queries if they exhaust retries).
 * Primary job: detect expired sessions and redirect to login once, not N
 * times per parallel request.
 */
let authErrorFired = false

function handleGlobalError(error: unknown): void {
	if (!isApiError(error)) return
	if (!error.isAuthError) return
	if (authErrorFired) return

	authErrorFired = true
	onAuthError?.()

	// Reset after a short delay so a second expired-session scenario
	// (e.g. user logs back in, session expires again) still triggers.
	setTimeout(() => {
		authErrorFired = false
	}, 2000)
}

/* -------------------------------------------------------------------------- */
/*  QueryClient                                                               */
/* -------------------------------------------------------------------------- */

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: shouldRetry,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
			refetchOnMount: true,
			refetchOnWindowFocus: true,
			staleTime: 3 * 60 * 1000,
			throwOnError: shouldThrowOnError,
		},
		mutations: {
			retry: shouldRetry,
			onError: handleGlobalError,
		},
	},
})

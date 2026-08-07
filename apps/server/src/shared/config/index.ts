// ─── Application Constants ───

/** Cookie name for the session token. */
export const SESSION_COOKIE_NAME = 'ikki_session'

/** Session idle TTL in days. */
export const SESSION_TTL_DAYS = 7

/** Role code that bypasses all permission checks. */
export const OWNER_ROLE_CODE = 'owner'

/** Auth context cache TTL in seconds (cached to avoid DB call per request). */
export const AUTH_CACHE_TTL_SECONDS = 60

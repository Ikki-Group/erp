// ─── Application Constants ───

export const SERVICE_NAME = 'ikki-server'

/** Cookie name for the session token. */
export const SESSION_COOKIE_NAME = 'ikki_session'

/** Session idle TTL in days. */
export const SESSION_TTL_DAYS = 7
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60

/** Role code that bypasses all permission checks. */
export const OWNER_ROLE_CODE = 'owner'

/** Auth context cache TTL in seconds (cached to avoid DB call per request). */
export const AUTH_CACHE_TTL_SECONDS = 60

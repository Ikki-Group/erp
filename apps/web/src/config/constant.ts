export const APP_VERSION = '0.0.1'

export const IS_DEV = import.meta.env.DEV
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

/**
 * Prototype/design-phase switch. When `'mock'`, the API layer serves data
 * from an in-memory fixture store instead of performing real network
 * requests — see `@/lib/mock`. Defaults to real network in every other
 * case, so `bun run dev`/e2e/prod builds are unaffected unless explicitly
 * opted in via `VITE_API_MODE=mock`.
 */
export const API_MODE = import.meta.env.VITE_API_MODE ?? 'live'
export const IS_MOCK_API = API_MODE === 'mock'

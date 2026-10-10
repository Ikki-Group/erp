/**
 * Shared test data constants for E2E tests.
 * Values must match the seeded database (apps/server/scripts/seeds/*).
 */
const PASSWORD = 'password123'

export const TEST_CREDENTIALS = {
	owner: { username: 'owner', password: PASSWORD },
	manager: { username: 'manager', password: PASSWORD },
	cashier: { username: 'cashier', password: PASSWORD },
	warehouse: { username: 'warehouse', password: PASSWORD },
	multiLocation: { username: 'multi-location', password: PASSWORD },
} as const

export const SEED = {
	/** Owner, manager and cashier work here; holds the seeded stock. */
	store: { id: 1, name: 'Kedai Kopi Nusantara', code: 'STORE-01' },
	/** Warehouse staff works here; starts with no stock. */
	warehouse: { id: 2, name: 'Warehouse Pusat', code: 'WH-01' },
	supplier: 'PT Kopi Nusantara',
	/** Base unit pcs — the only seeded material receivable in pcs. */
	pcsMaterial: 'Paper Cup 12oz',
} as const

/** Base URL of the API server the web app talks to. */
export const API_URL = process.env.API_URL ?? 'http://127.0.0.1:4100'

/** Short unique suffix so parallel tests never collide on codes/names. */
export function uid(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
}

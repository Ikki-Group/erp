/**
 * Shared test data constants for E2E tests.
 * Values must match the seeded database (scripts/seed.ts in apps/server).
 */

export const TEST_CREDENTIALS = {
	owner: { username: 'owner', password: 'password123' },
	cashier: { username: 'cashier', password: 'password123' },
} as const

export const SEED = {
	locationId: 1,
	storeName: 'Kedai Kopi Nusantara',
	warehouseName: 'Warehouse Pusat',
} as const

/** Short random suffix so parallel workers never collide on unique codes. */
export function uniqueSuffix(): string {
	return Math.random().toString(36).slice(2, 8)
}

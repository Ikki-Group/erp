/**
 * Seed helpers for integration tests.
 *
 * Assumes `bun run test:db:reset` has been run before the test suite starts
 * (resets DB + applies migrations + seeds). This file provides convenience
 * constants for the known seed data so tests don't hardcode magic numbers.
 *
 * If the test DB is not seeded, integration tests will fail at loginAs()
 * with a clear error message.
 */

// ─── Seed Users (from scripts/seed.ts) ───

export const SEED_USERS = {
	owner: { username: 'owner', password: 'password123' },
	cashier: { username: 'cashier', password: 'password123' },
} as const

// ─── Seed Location ───

export const SEED_LOCATION_ID = 1

// ─── Seed Payment Method ───

export const SEED_PAYMENT_METHOD_ID = 1

// ─── Seed Menu Item ───

export const SEED_MENU_ITEM_ID = 1

// ─── Seed Material (for stock tests) ───

export const SEED_MATERIAL_ID = 1

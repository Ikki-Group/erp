/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Payment Methods, Payment Method Locations, Tables
 */
import type { LocationIds } from './core.ts'
import type { Sql } from 'postgres'

export interface PaymentMethodIds {
	cash: number
	qris: number
	debit: number
}

export interface TableIds {
	a1: number
	a2: number
	a3: number
	a4: number
}

// ─── Payment Methods ───

const PAYMENT_METHODS = [
	{ code: 'CASH', name: 'Cash', type: 'cash' },
	{ code: 'QRIS', name: 'QRIS', type: 'digital' },
	{ code: 'DEBIT', name: 'Debit Card', type: 'digital' },
]

export async function seedPaymentMethods(sql: Sql): Promise<PaymentMethodIds> {
	console.log('  → Seeding payment methods...')
	const rows = await sql`
		INSERT INTO payment_methods (code, name, type, is_active)
		VALUES ${sql(PAYMENT_METHODS.map((p) => [p.code, p.name, p.type, 1]))}
		RETURNING id, code
	`

	return {
		cash: rows.find((r) => r.code === 'CASH')!.id as number,
		qris: rows.find((r) => r.code === 'QRIS')!.id as number,
		debit: rows.find((r) => r.code === 'DEBIT')!.id as number,
	}
}

// ─── Payment Method ↔ Location ───

export async function seedPaymentMethodLocations(
	sql: Sql,
	paymentMethodIds: PaymentMethodIds,
	locationIds: LocationIds,
): Promise<void> {
	console.log('  → Seeding payment method ↔ location links...')

	// All payment methods enabled at the store
	const links = [
		[paymentMethodIds.cash, locationIds.store, 1],
		[paymentMethodIds.qris, locationIds.store, 1],
		[paymentMethodIds.debit, locationIds.store, 1],
	]

	await sql`
		INSERT INTO payment_method_locations (payment_method_id, location_id, is_enabled)
		VALUES ${sql(links)}
	`
}

// ─── Tables ───

export async function seedTables(sql: Sql, locationIds: LocationIds): Promise<TableIds> {
	console.log('  → Seeding tables...')

	const tables = [
		{ number: 'A1', capacity: 4 },
		{ number: 'A2', capacity: 4 },
		{ number: 'A3', capacity: 2 },
		{ number: 'A4', capacity: 6 },
	]

	const rows = await sql`
		INSERT INTO tables (location_id, number, capacity, status, is_active)
		VALUES ${sql(tables.map((t) => [locationIds.store, t.number, t.capacity, 'available', 1]))}
		RETURNING id, number
	`

	return {
		a1: rows.find((r) => r.number === 'A1')!.id as number,
		a2: rows.find((r) => r.number === 'A2')!.id as number,
		a3: rows.find((r) => r.number === 'A3')!.id as number,
		a4: rows.find((r) => r.number === 'A4')!.id as number,
	}
}

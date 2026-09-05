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
	const rows = await Promise.all(
		PAYMENT_METHODS.map(async (p) => {
			const [row] = await sql`
				INSERT INTO payment_methods (code, name, type, is_active)
				VALUES (${p.code}, ${p.name}, ${p.type}, true)
				RETURNING id, code
			`
			return row!
		}),
	)

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
	for (const paymentMethodId of [
		paymentMethodIds.cash,
		paymentMethodIds.qris,
		paymentMethodIds.debit,
	]) {
		await sql`
			INSERT INTO payment_method_locations (payment_method_id, location_id, is_enabled)
			VALUES (${paymentMethodId}, ${locationIds.store}, true)
		`
	}
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

	const rows = await Promise.all(
		tables.map(async (t) => {
			const [row] = await sql`
				INSERT INTO tables (location_id, number, capacity, status, is_active)
				VALUES (${locationIds.store}, ${t.number}, ${t.capacity}, 'available', true)
				RETURNING id, number
			`
			return row!
		}),
	)

	return {
		a1: rows.find((r) => r.number === 'A1')!.id as number,
		a2: rows.find((r) => r.number === 'A2')!.id as number,
		a3: rows.find((r) => r.number === 'A3')!.id as number,
		a4: rows.find((r) => r.number === 'A4')!.id as number,
	}
}

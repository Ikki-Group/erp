/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Units of Measure + Conversions
 */
import type { Sql } from 'postgres'

export interface UomIds {
	kg: number
	g: number
	L: number
	ml: number
	pcs: number
}

const UOMS = [
	{ code: 'kg', name: 'Kilogram', category: 'weight' },
	{ code: 'g', name: 'Gram', category: 'weight' },
	{ code: 'L', name: 'Liter', category: 'volume' },
	{ code: 'ml', name: 'Mililiter', category: 'volume' },
	{ code: 'pcs', name: 'Pieces', category: 'quantity' },
]

export async function seedUoms(sql: Sql): Promise<UomIds> {
	console.log('  → Seeding UoMs...')
	const rows = await sql`
		INSERT INTO uoms (code, name, category)
		VALUES ${sql(UOMS.map((u) => [u.code, u.name, u.category]))}
		RETURNING id, code
	`

	return {
		kg: rows.find((r) => r.code === 'kg')!.id as number,
		g: rows.find((r) => r.code === 'g')!.id as number,
		L: rows.find((r) => r.code === 'L')!.id as number,
		ml: rows.find((r) => r.code === 'ml')!.id as number,
		pcs: rows.find((r) => r.code === 'pcs')!.id as number,
	}
}

export async function seedUomConversions(sql: Sql, uomIds: UomIds): Promise<void> {
	console.log('  → Seeding UoM conversions...')

	// kg → g: 1 kg = 1000 g
	// g → kg: 1 g = 0.001 kg
	// L → ml: 1 L = 1000 ml
	// ml → L: 1 ml = 0.001 L
	const conversions = [
		[uomIds.kg, uomIds.g, '1000'],
		[uomIds.g, uomIds.kg, '0.001'],
		[uomIds.L, uomIds.ml, '1000'],
		[uomIds.ml, uomIds.L, '0.001'],
	]

	await sql`
		INSERT INTO uom_conversions (from_uom_id, to_uom_id, factor)
		VALUES ${sql(conversions)}
	`
}

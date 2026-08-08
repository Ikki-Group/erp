/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Company settings + Locations
 */
import type { Sql } from 'postgres'

export interface LocationIds {
	store: number
	warehouse: number
}

export async function seedCompany(sql: Sql): Promise<void> {
	console.log('  → Seeding company settings...')
	await sql`
		INSERT INTO company_settings (name, address, phone, email, tax_id, tax_rate, currency_code, currency_symbol, receipt_footer)
		VALUES (
			'Kedai Kopi Nusantara',
			'Jl. Merdeka No. 17, Jakarta Selatan',
			'021-5551234',
			'hello@kedaikopinusantara.id',
			'01.234.567.8-012.000',
			'11.00',
			'IDR',
			'Rp',
			'Terima kasih atas kunjungan Anda! ☕'
		)
	`
}

export async function seedLocations(sql: Sql): Promise<LocationIds> {
	console.log('  → Seeding locations...')
	const rows = await sql`
		INSERT INTO locations (code, name, type, address, phone, is_active)
		VALUES
			('STORE-01', 'Kedai Kopi Nusantara', 'store', 'Jl. Merdeka No. 17, Jakarta Selatan', '021-5551234', 1),
			('WH-01', 'Warehouse Pusat', 'warehouse', 'Jl. Industri No. 5, Cibitung', '021-5559876', 1)
		RETURNING id, code
	`

	const store = rows.find((r) => r.code === 'STORE-01')
	const warehouse = rows.find((r) => r.code === 'WH-01')

	return {
		store: store!.id as number,
		warehouse: warehouse!.id as number,
	}
}

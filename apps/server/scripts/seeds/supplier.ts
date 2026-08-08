/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Suppliers + Supplier Material Pricing
 */
import type { MaterialIds } from './material.ts'
import type { UomIds } from './uom.ts'
import type { Sql } from 'postgres'

export interface SupplierIds {
	ptKopiNusantara: number
	cvSejahteraFood: number
}

const SUPPLIERS = [
	{
		code: 'SUP-001',
		name: 'PT Kopi Nusantara',
		contactPerson: 'Hendra Wijaya',
		phone: '0812-3456-7890',
		email: 'hendra@kopinusantara.co.id',
		address: 'Jl. Kopi Raya No. 88, Bandung',
		paymentTerms: 30,
	},
	{
		code: 'SUP-002',
		name: 'CV Sejahtera Food Supply',
		contactPerson: 'Linda Hartono',
		phone: '0813-9876-5432',
		email: 'linda@sejahterafood.id',
		address: 'Jl. Pasar Induk No. 12, Tangerang',
		paymentTerms: 14,
	},
]

export async function seedSuppliers(sql: Sql): Promise<SupplierIds> {
	console.log('  → Seeding suppliers...')
	const rows = await sql`
		INSERT INTO suppliers (code, name, contact_person, phone, email, address, payment_terms, is_active)
		VALUES ${sql(SUPPLIERS.map((s) => [s.code, s.name, s.contactPerson, s.phone, s.email, s.address, s.paymentTerms, 1]))}
		RETURNING id, code
	`

	return {
		ptKopiNusantara: rows.find((r) => r.code === 'SUP-001')!.id as number,
		cvSejahteraFood: rows.find((r) => r.code === 'SUP-002')!.id as number,
	}
}

export async function seedSupplierMaterials(
	sql: Sql,
	supplierIds: SupplierIds,
	materialIds: MaterialIds,
	uomIds: UomIds,
): Promise<void> {
	console.log('  → Seeding supplier material pricing...')

	// PT Kopi Nusantara: coffee beans, matcha, green tea
	// CV Sejahtera Food: milk, sugar, ice, chocolate sauce, vanilla syrup, cups
	const pricing = [
		// supplier_id, material_id, unit_price, uom_id, min_order_qty
		[supplierIds.ptKopiNusantara, materialIds.coffeeBeans, '185000.00', uomIds.kg, '5.000000'],
		[supplierIds.ptKopiNusantara, materialIds.matchaPowder, '350000.00', uomIds.kg, '0.500000'],
		[supplierIds.ptKopiNusantara, materialIds.greenTeaPowder, '120000.00', uomIds.kg, '0.500000'],
		[supplierIds.cvSejahteraFood, materialIds.freshMilk, '18000.00', uomIds.L, '5.000000'],
		[supplierIds.cvSejahteraFood, materialIds.condensedMilk, '25000.00', uomIds.L, '2.000000'],
		[supplierIds.cvSejahteraFood, materialIds.sugar, '14000.00', uomIds.kg, '10.000000'],
		[supplierIds.cvSejahteraFood, materialIds.brownSugar, '28000.00', uomIds.kg, '2.000000'],
		[supplierIds.cvSejahteraFood, materialIds.ice, '5000.00', uomIds.kg, '20.000000'],
		[supplierIds.cvSejahteraFood, materialIds.chocolateSauce, '45000.00', uomIds.L, '1.000000'],
		[supplierIds.cvSejahteraFood, materialIds.vanillaSyrup, '55000.00', uomIds.L, '1.000000'],
		[supplierIds.cvSejahteraFood, materialIds.plasticCup, '850.00', uomIds.pcs, '100.000000'],
		[supplierIds.cvSejahteraFood, materialIds.paperCup, '1200.00', uomIds.pcs, '100.000000'],
	]

	await sql`
		INSERT INTO supplier_materials (supplier_id, material_id, unit_price, uom_id, min_order_qty)
		VALUES ${sql(pricing)}
	`
}

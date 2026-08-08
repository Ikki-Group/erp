/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Material Categories, Materials, Material-Location assignments
 */
import type { LocationIds } from './core.ts'
import type { UomIds } from './uom.ts'
import type { Sql } from 'postgres'

export interface MaterialCategoryIds {
	dairy: number
	dryGoods: number
	beverages: number
	packaging: number
}

export interface MaterialIds {
	coffeeBeans: number
	greenTeaPowder: number
	matchaPowder: number
	freshMilk: number
	condensedMilk: number
	sugar: number
	brownSugar: number
	ice: number
	chocolateSauce: number
	vanillaSyrup: number
	plasticCup: number
	paperCup: number
}

const CATEGORIES = [
	{ name: 'Dairy' },
	{ name: 'Dry Goods' },
	{ name: 'Beverages' },
	{ name: 'Packaging' },
]

export async function seedMaterialCategories(sql: Sql): Promise<MaterialCategoryIds> {
	console.log('  → Seeding material categories...')
	const rows = await sql`
		INSERT INTO material_categories (name)
		VALUES ${sql(CATEGORIES.map((c) => [c.name]))}
		RETURNING id, name
	`

	return {
		dairy: rows.find((r) => r.name === 'Dairy')!.id as number,
		dryGoods: rows.find((r) => r.name === 'Dry Goods')!.id as number,
		beverages: rows.find((r) => r.name === 'Beverages')!.id as number,
		packaging: rows.find((r) => r.name === 'Packaging')!.id as number,
	}
}

export async function seedMaterials(
	sql: Sql,
	categoryIds: MaterialCategoryIds,
	uomIds: UomIds,
): Promise<MaterialIds> {
	console.log('  → Seeding materials...')

	const MATERIALS = [
		{
			code: 'MAT-001',
			name: 'Biji Kopi Arabica',
			type: 'raw',
			categoryId: categoryIds.dryGoods,
			baseUomId: uomIds.kg,
			minStock: '2.000000',
		},
		{
			code: 'MAT-002',
			name: 'Green Tea Powder',
			type: 'raw',
			categoryId: categoryIds.beverages,
			baseUomId: uomIds.g,
			minStock: '500.000000',
		},
		{
			code: 'MAT-003',
			name: 'Matcha Powder',
			type: 'raw',
			categoryId: categoryIds.beverages,
			baseUomId: uomIds.g,
			minStock: '300.000000',
		},
		{
			code: 'MAT-004',
			name: 'Fresh Milk',
			type: 'raw',
			categoryId: categoryIds.dairy,
			baseUomId: uomIds.ml,
			minStock: '5000.000000',
		},
		{
			code: 'MAT-005',
			name: 'Condensed Milk',
			type: 'raw',
			categoryId: categoryIds.dairy,
			baseUomId: uomIds.ml,
			minStock: '2000.000000',
		},
		{
			code: 'MAT-006',
			name: 'Gula Pasir',
			type: 'raw',
			categoryId: categoryIds.dryGoods,
			baseUomId: uomIds.kg,
			minStock: '5.000000',
		},
		{
			code: 'MAT-007',
			name: 'Brown Sugar',
			type: 'raw',
			categoryId: categoryIds.dryGoods,
			baseUomId: uomIds.g,
			minStock: '1000.000000',
		},
		{
			code: 'MAT-008',
			name: 'Es Batu',
			type: 'raw',
			categoryId: categoryIds.beverages,
			baseUomId: uomIds.kg,
			minStock: '10.000000',
		},
		{
			code: 'MAT-009',
			name: 'Chocolate Sauce',
			type: 'raw',
			categoryId: categoryIds.beverages,
			baseUomId: uomIds.ml,
			minStock: '1000.000000',
		},
		{
			code: 'MAT-010',
			name: 'Vanilla Syrup',
			type: 'raw',
			categoryId: categoryIds.beverages,
			baseUomId: uomIds.ml,
			minStock: '1000.000000',
		},
		{
			code: 'MAT-011',
			name: 'Plastic Cup 22oz',
			type: 'raw',
			categoryId: categoryIds.packaging,
			baseUomId: uomIds.pcs,
			minStock: '200.000000',
		},
		{
			code: 'MAT-012',
			name: 'Paper Cup 12oz',
			type: 'raw',
			categoryId: categoryIds.packaging,
			baseUomId: uomIds.pcs,
			minStock: '200.000000',
		},
	]

	const rows = await sql`
		INSERT INTO materials (code, name, type, category_id, base_uom_id, min_stock, is_active)
		VALUES ${sql(MATERIALS.map((m) => [m.code, m.name, m.type, m.categoryId, m.baseUomId, m.minStock, 1]))}
		RETURNING id, code
	`

	return {
		coffeeBeans: rows.find((r) => r.code === 'MAT-001')!.id as number,
		greenTeaPowder: rows.find((r) => r.code === 'MAT-002')!.id as number,
		matchaPowder: rows.find((r) => r.code === 'MAT-003')!.id as number,
		freshMilk: rows.find((r) => r.code === 'MAT-004')!.id as number,
		condensedMilk: rows.find((r) => r.code === 'MAT-005')!.id as number,
		sugar: rows.find((r) => r.code === 'MAT-006')!.id as number,
		brownSugar: rows.find((r) => r.code === 'MAT-007')!.id as number,
		ice: rows.find((r) => r.code === 'MAT-008')!.id as number,
		chocolateSauce: rows.find((r) => r.code === 'MAT-009')!.id as number,
		vanillaSyrup: rows.find((r) => r.code === 'MAT-010')!.id as number,
		plasticCup: rows.find((r) => r.code === 'MAT-011')!.id as number,
		paperCup: rows.find((r) => r.code === 'MAT-012')!.id as number,
	}
}

export async function seedMaterialLocations(
	sql: Sql,
	materialIds: MaterialIds,
	locationIds: LocationIds,
): Promise<void> {
	console.log('  → Seeding material-location assignments...')

	// All materials available at both locations
	const allMaterialIdValues = Object.values(materialIds)
	const assignments: [number, number][] = []

	for (const matId of allMaterialIdValues) {
		assignments.push([matId, locationIds.store])
		assignments.push([matId, locationIds.warehouse])
	}

	await sql`
		INSERT INTO material_locations (material_id, location_id)
		VALUES ${sql(assignments)}
	`
}

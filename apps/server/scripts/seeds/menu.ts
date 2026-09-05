/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Menu Categories, Menu Items, Modifier Groups/Options, Recipes
 */
import type { LocationIds } from './core.ts'
import type { MaterialIds } from './material.ts'
import type { UomIds } from './uom.ts'
import type { Sql } from 'postgres'

export interface MenuCategoryIds {
	coffee: number
	nonCoffee: number
	food: number
	snacks: number
}

export interface MenuItemIds {
	icedLatte: number
	hotAmericano: number
	cappuccino: number
	icedMocha: number
	matchaLatte: number
	greenTeaLatte: number
	croissant: number
	nasiGoreng: number
}

export interface ModifierGroupIds {
	size: number
	iceLevel: number
	sugarLevel: number
}

export interface ModifierOptionIds {
	sizeRegular: number
	sizeLarge: number
	iceNormal: number
	iceLess: number
	iceNone: number
	sugarNormal: number
	sugarLess: number
	sugarNone: number
}

export interface RecipeIds {
	icedLatte: number
	hotAmericano: number
	cappuccino: number
	icedMocha: number
	matchaLatte: number
	greenTeaLatte: number
}

// ─── Menu Categories ───

export async function seedMenuCategories(
	sql: Sql,
	locationIds: LocationIds,
): Promise<MenuCategoryIds> {
	console.log('  → Seeding menu categories...')
	const categories = [
		{ locationId: locationIds.store, name: 'Coffee', sortOrder: 1 },
		{ locationId: locationIds.store, name: 'Non-Coffee', sortOrder: 2 },
		{ locationId: locationIds.store, name: 'Food', sortOrder: 3 },
		{ locationId: locationIds.store, name: 'Snacks', sortOrder: 4 },
	]

	const rows = await sql`
		INSERT INTO menu_categories (location_id, name, sort_order)
		VALUES ${sql(categories.map((c) => [c.locationId, c.name, c.sortOrder]))}
		RETURNING id, name
	`

	return {
		coffee: rows.find((r) => r.name === 'Coffee')!.id as number,
		nonCoffee: rows.find((r) => r.name === 'Non-Coffee')!.id as number,
		food: rows.find((r) => r.name === 'Food')!.id as number,
		snacks: rows.find((r) => r.name === 'Snacks')!.id as number,
	}
}

// ─── Menu Items ───

export async function seedMenuItems(
	sql: Sql,
	locationIds: LocationIds,
	categoryIds: MenuCategoryIds,
): Promise<MenuItemIds> {
	console.log('  → Seeding menu items...')

	const items = [
		{ sku: 'MNU-001', name: 'Iced Latte', categoryId: categoryIds.coffee, basePrice: '28000.00' },
		{
			sku: 'MNU-002',
			name: 'Hot Americano',
			categoryId: categoryIds.coffee,
			basePrice: '22000.00',
		},
		{ sku: 'MNU-003', name: 'Cappuccino', categoryId: categoryIds.coffee, basePrice: '30000.00' },
		{ sku: 'MNU-004', name: 'Iced Mocha', categoryId: categoryIds.coffee, basePrice: '32000.00' },
		{
			sku: 'MNU-005',
			name: 'Matcha Latte',
			categoryId: categoryIds.nonCoffee,
			basePrice: '30000.00',
		},
		{
			sku: 'MNU-006',
			name: 'Green Tea Latte',
			categoryId: categoryIds.nonCoffee,
			basePrice: '28000.00',
		},
		{ sku: 'MNU-007', name: 'Croissant', categoryId: categoryIds.snacks, basePrice: '18000.00' },
		{
			sku: 'MNU-008',
			name: 'Nasi Goreng Spesial',
			categoryId: categoryIds.food,
			basePrice: '35000.00',
		},
	]

	const rows = await sql`
		INSERT INTO menu_items (location_id, sku, name, category_id, base_price, status)
		VALUES ${sql(items.map((i) => [locationIds.store, i.sku, i.name, i.categoryId, i.basePrice, 'active']))}
		RETURNING id, sku
	`

	return {
		icedLatte: rows.find((r) => r.sku === 'MNU-001')!.id as number,
		hotAmericano: rows.find((r) => r.sku === 'MNU-002')!.id as number,
		cappuccino: rows.find((r) => r.sku === 'MNU-003')!.id as number,
		icedMocha: rows.find((r) => r.sku === 'MNU-004')!.id as number,
		matchaLatte: rows.find((r) => r.sku === 'MNU-005')!.id as number,
		greenTeaLatte: rows.find((r) => r.sku === 'MNU-006')!.id as number,
		croissant: rows.find((r) => r.sku === 'MNU-007')!.id as number,
		nasiGoreng: rows.find((r) => r.sku === 'MNU-008')!.id as number,
	}
}

// ─── Modifier Groups ───

export async function seedModifierGroups(
	sql: Sql,
	locationIds: LocationIds,
): Promise<ModifierGroupIds> {
	console.log('  → Seeding modifier groups...')

	const groups = [
		{ name: 'Size', selectionType: 'single', isRequired: true, minSelect: 1, maxSelect: 1 },
		{ name: 'Ice Level', selectionType: 'single', isRequired: false, minSelect: 0, maxSelect: 1 },
		{
			name: 'Sugar Level',
			selectionType: 'single',
			isRequired: false,
			minSelect: 0,
			maxSelect: 1,
		},
	]

	const rows = await Promise.all(
		groups.map(async (g) => {
			const [row] = await sql`
				INSERT INTO modifier_groups (location_id, name, selection_type, is_required, min_select, max_select)
				VALUES (${locationIds.store}, ${g.name}, ${g.selectionType}, ${g.isRequired}, ${g.minSelect}, ${g.maxSelect})
				RETURNING id, name
			`
			return row!
		}),
	)

	return {
		size: rows.find((r) => r.name === 'Size')!.id as number,
		iceLevel: rows.find((r) => r.name === 'Ice Level')!.id as number,
		sugarLevel: rows.find((r) => r.name === 'Sugar Level')!.id as number,
	}
}

// ─── Modifier Options ───

export async function seedModifierOptions(
	sql: Sql,
	groupIds: ModifierGroupIds,
): Promise<ModifierOptionIds> {
	console.log('  → Seeding modifier options...')

	const options = [
		// Size
		{
			groupId: groupIds.size,
			name: 'Regular',
			priceAdjustment: '0.00',
			isDefault: true,
			sortOrder: 1,
		},
		{
			groupId: groupIds.size,
			name: 'Large',
			priceAdjustment: '5000.00',
			isDefault: false,
			sortOrder: 2,
		},
		// Ice Level
		{
			groupId: groupIds.iceLevel,
			name: 'Normal Ice',
			priceAdjustment: '0.00',
			isDefault: true,
			sortOrder: 1,
		},
		{
			groupId: groupIds.iceLevel,
			name: 'Less Ice',
			priceAdjustment: '0.00',
			isDefault: false,
			sortOrder: 2,
		},
		{
			groupId: groupIds.iceLevel,
			name: 'No Ice',
			priceAdjustment: '0.00',
			isDefault: false,
			sortOrder: 3,
		},
		// Sugar Level
		{
			groupId: groupIds.sugarLevel,
			name: 'Normal Sugar',
			priceAdjustment: '0.00',
			isDefault: true,
			sortOrder: 1,
		},
		{
			groupId: groupIds.sugarLevel,
			name: 'Less Sugar',
			priceAdjustment: '0.00',
			isDefault: false,
			sortOrder: 2,
		},
		{
			groupId: groupIds.sugarLevel,
			name: 'No Sugar',
			priceAdjustment: '0.00',
			isDefault: false,
			sortOrder: 3,
		},
	]

	const rows = await Promise.all(
		options.map(async (o) => {
			const [row] = await sql`
				INSERT INTO modifier_options (group_id, name, price_adjustment, is_default, sort_order)
				VALUES (${o.groupId}, ${o.name}, ${o.priceAdjustment}, ${o.isDefault}, ${o.sortOrder})
				RETURNING id, name
			`
			return row!
		}),
	)

	return {
		sizeRegular: rows.find((r) => r.name === 'Regular')!.id as number,
		sizeLarge: rows.find((r) => r.name === 'Large')!.id as number,
		iceNormal: rows.find((r) => r.name === 'Normal Ice')!.id as number,
		iceLess: rows.find((r) => r.name === 'Less Ice')!.id as number,
		iceNone: rows.find((r) => r.name === 'No Ice')!.id as number,
		sugarNormal: rows.find((r) => r.name === 'Normal Sugar')!.id as number,
		sugarLess: rows.find((r) => r.name === 'Less Sugar')!.id as number,
		sugarNone: rows.find((r) => r.name === 'No Sugar')!.id as number,
	}
}

// ─── Menu Item ↔ Modifier Group (M:N) ───

export async function seedMenuItemModifiers(
	sql: Sql,
	menuItemIds: MenuItemIds,
	modifierGroupIds: ModifierGroupIds,
): Promise<void> {
	console.log('  → Seeding menu item ↔ modifier group links...')

	// All drink items get Size, Ice Level, Sugar Level
	const drinkItems = [
		menuItemIds.icedLatte,
		menuItemIds.hotAmericano,
		menuItemIds.cappuccino,
		menuItemIds.icedMocha,
		menuItemIds.matchaLatte,
		menuItemIds.greenTeaLatte,
	]

	const links: [number, number, number][] = []
	for (const itemId of drinkItems) {
		links.push([itemId, modifierGroupIds.size, 1])
		links.push([itemId, modifierGroupIds.iceLevel, 2])
		links.push([itemId, modifierGroupIds.sugarLevel, 3])
	}

	await sql`
		INSERT INTO menu_item_modifiers (menu_item_id, modifier_group_id, sort_order)
		VALUES ${sql(links)}
	`
}

// ─── Recipes ───

export async function seedRecipes(sql: Sql, menuItemIds: MenuItemIds): Promise<RecipeIds> {
	console.log('  → Seeding recipes...')

	const recipes = [
		{ menuItemId: menuItemIds.icedLatte, name: 'Iced Latte Recipe', yieldQty: '1.000000' },
		{ menuItemId: menuItemIds.hotAmericano, name: 'Hot Americano Recipe', yieldQty: '1.000000' },
		{ menuItemId: menuItemIds.cappuccino, name: 'Cappuccino Recipe', yieldQty: '1.000000' },
		{ menuItemId: menuItemIds.icedMocha, name: 'Iced Mocha Recipe', yieldQty: '1.000000' },
		{ menuItemId: menuItemIds.matchaLatte, name: 'Matcha Latte Recipe', yieldQty: '1.000000' },
		{ menuItemId: menuItemIds.greenTeaLatte, name: 'Green Tea Latte Recipe', yieldQty: '1.000000' },
	]

	const rows = await Promise.all(
		recipes.map(async (r) => {
			const [row] = await sql`
				INSERT INTO recipes (menu_item_id, name, yield_qty, is_active)
				VALUES (${r.menuItemId}, ${r.name}, ${r.yieldQty}, true)
				RETURNING id, menu_item_id
			`
			return row!
		}),
	)

	return {
		icedLatte: rows.find((r) => r.menu_item_id === menuItemIds.icedLatte)!.id as number,
		hotAmericano: rows.find((r) => r.menu_item_id === menuItemIds.hotAmericano)!.id as number,
		cappuccino: rows.find((r) => r.menu_item_id === menuItemIds.cappuccino)!.id as number,
		icedMocha: rows.find((r) => r.menu_item_id === menuItemIds.icedMocha)!.id as number,
		matchaLatte: rows.find((r) => r.menu_item_id === menuItemIds.matchaLatte)!.id as number,
		greenTeaLatte: rows.find((r) => r.menu_item_id === menuItemIds.greenTeaLatte)!.id as number,
	}
}

// ─── Recipe Lines ───

export async function seedRecipeLines(
	sql: Sql,
	recipeIds: RecipeIds,
	materialIds: MaterialIds,
	uomIds: UomIds,
): Promise<void> {
	console.log('  → Seeding recipe lines...')

	// recipe_id, material_id, quantity, uom_id
	const lines = [
		// Iced Latte: coffee 20g + fresh milk 200ml + ice 100g + sugar 10g
		[recipeIds.icedLatte, materialIds.coffeeBeans, '20.000000', uomIds.g],
		[recipeIds.icedLatte, materialIds.freshMilk, '200.000000', uomIds.ml],
		[recipeIds.icedLatte, materialIds.ice, '100.000000', uomIds.g],
		[recipeIds.icedLatte, materialIds.sugar, '10.000000', uomIds.g],
		// Hot Americano: coffee 20g
		[recipeIds.hotAmericano, materialIds.coffeeBeans, '20.000000', uomIds.g],
		// Cappuccino: coffee 20g + fresh milk 150ml
		[recipeIds.cappuccino, materialIds.coffeeBeans, '20.000000', uomIds.g],
		[recipeIds.cappuccino, materialIds.freshMilk, '150.000000', uomIds.ml],
		// Iced Mocha: coffee 20g + fresh milk 150ml + chocolate sauce 30ml + ice 100g
		[recipeIds.icedMocha, materialIds.coffeeBeans, '20.000000', uomIds.g],
		[recipeIds.icedMocha, materialIds.freshMilk, '150.000000', uomIds.ml],
		[recipeIds.icedMocha, materialIds.chocolateSauce, '30.000000', uomIds.ml],
		[recipeIds.icedMocha, materialIds.ice, '100.000000', uomIds.g],
		// Matcha Latte: matcha 5g + fresh milk 250ml + ice 100g
		[recipeIds.matchaLatte, materialIds.matchaPowder, '5.000000', uomIds.g],
		[recipeIds.matchaLatte, materialIds.freshMilk, '250.000000', uomIds.ml],
		[recipeIds.matchaLatte, materialIds.ice, '100.000000', uomIds.g],
		// Green Tea Latte: green tea 5g + fresh milk 250ml + ice 100g
		[recipeIds.greenTeaLatte, materialIds.greenTeaPowder, '5.000000', uomIds.g],
		[recipeIds.greenTeaLatte, materialIds.freshMilk, '250.000000', uomIds.ml],
		[recipeIds.greenTeaLatte, materialIds.ice, '100.000000', uomIds.g],
	]

	await sql`
		INSERT INTO recipe_lines (recipe_id, material_id, quantity, uom_id)
		VALUES ${sql(lines)}
	`
}

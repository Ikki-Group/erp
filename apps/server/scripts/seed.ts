/**
 * Main seed orchestrator.
 * Seeds all Phase 1 data in dependency order.
 * Idempotent: truncates tables before inserting (reverse dependency order).
 */
import postgres from 'postgres'

import { seedCompany, seedLocations } from './seeds/core.ts'
import { seedRoles, seedUsers, seedAssignments } from './seeds/iam.ts'
import { seedUoms, seedUomConversions } from './seeds/uom.ts'
import { seedMaterialCategories, seedMaterials, seedMaterialLocations } from './seeds/material.ts'
import { seedSuppliers, seedSupplierMaterials } from './seeds/supplier.ts'
import {
	seedMenuCategories,
	seedMenuItems,
	seedModifierGroups,
	seedModifierOptions,
	seedMenuItemModifiers,
	seedRecipes,
	seedRecipeLines,
} from './seeds/menu.ts'
import { seedPaymentMethods, seedPaymentMethodLocations, seedTables } from './seeds/pos.ts'
import { seedSampleOrder } from './seeds/sample-order.ts'

const url = process.env['DATABASE_URL']
if (!url) {
	console.error('DATABASE_URL not set')
	process.exit(1)
}

const sql = postgres(url)

// ─── Truncate in reverse dependency order ───

const TRUNCATE_ORDER = [
	// Layer 2 — operations (most dependent)
	'stock_movements',
	'stock_balances',
	'payments',
	'order_lines',
	'orders',
	'cashier_shifts',
	'receiving_lines',
	'receivings',
	'transfer_lines',
	'transfer_requests',
	'stock_opname_lines',
	'stock_opnames',
	'production_orders',
	'production_recipe_lines',
	'production_recipes',
	'document_sequences',
	// Layer 1 — master data
	'recipe_lines',
	'recipes',
	'menu_item_modifiers',
	'modifier_options',
	'modifier_groups',
	'menu_items',
	'menu_categories',
	'payment_method_locations',
	'payment_methods',
	'tables',
	'supplier_materials',
	'suppliers',
	'material_locations',
	'materials',
	'material_categories',
	'uom_conversions',
	'uoms',
	// Layer 0 — core (except audit)
	'user_assignments',
	'sessions',
	'users',
	'roles',
	'locations',
	'company_settings',
]

async function truncateAll(): Promise<void> {
	console.log('[seed] Truncating tables...')
	for (const table of TRUNCATE_ORDER) {
		await sql.unsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`)
	}
	console.log('[seed] All tables truncated.')
}

// ─── Seed in dependency order ───

async function seedAll(): Promise<void> {
	console.log('[seed] Seeding data...')

	// Layer 0 — Core
	await seedCompany(sql)
	const locationIds = await seedLocations(sql)

	// Layer 0 — IAM
	const roleIds = await seedRoles(sql)
	const userIds = await seedUsers(sql)
	await seedAssignments(sql, userIds, roleIds, locationIds)

	// Layer 1 — UoM
	const uomIds = await seedUoms(sql)
	await seedUomConversions(sql, uomIds)

	// Layer 1 — Materials
	const categoryIds = await seedMaterialCategories(sql)
	const materialIds = await seedMaterials(sql, categoryIds, uomIds)
	await seedMaterialLocations(sql, materialIds, locationIds)

	// Layer 1 — Suppliers
	const supplierIds = await seedSuppliers(sql)
	await seedSupplierMaterials(sql, supplierIds, materialIds, uomIds)

	// Layer 1 — Menu + Recipes
	const menuCategoryIds = await seedMenuCategories(sql, locationIds)
	const menuItemIds = await seedMenuItems(sql, locationIds, menuCategoryIds)
	const modifierGroupIds = await seedModifierGroups(sql, locationIds)
	const modifierOptionIds = await seedModifierOptions(sql, modifierGroupIds)
	await seedMenuItemModifiers(sql, menuItemIds, modifierGroupIds)
	const recipeIds = await seedRecipes(sql, menuItemIds)
	await seedRecipeLines(sql, recipeIds, materialIds, uomIds)

	// Layer 2 — POS Setup
	const paymentMethodIds = await seedPaymentMethods(sql)
	await seedPaymentMethodLocations(sql, paymentMethodIds, locationIds)
	const tableIds = await seedTables(sql, locationIds)

	// Layer 2 — Sample Order
	await seedSampleOrder(sql, {
		locationIds,
		userIds,
		menuItemIds,
		paymentMethodIds,
		tableIds,
		modifierOptionIds,
	})

	console.log('[seed] All data seeded successfully!')
}

// ─── Main ───

try {
	await truncateAll()
	await seedAll()
} catch (error) {
	console.error('[seed] Error:', error)
	process.exit(1)
} finally {
	await sql.end()
}

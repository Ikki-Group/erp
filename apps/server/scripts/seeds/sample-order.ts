/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unsafe-argument, typescript/no-unsafe-assignment */
/**
 * Seed: Sample completed order with full lifecycle
 * Opens a shift, creates an order with lines, records payment, completes order.
 * Also seeds initial stock balances so the order makes sense.
 */
import type { LocationIds } from './core.ts'
import type { UserIds } from './iam.ts'
import type { MenuItemIds } from './menu.ts'
import type { ModifierOptionIds } from './menu.ts'
import type { PaymentMethodIds } from './pos.ts'
import type { TableIds } from './pos.ts'
import type { Sql } from 'postgres'

interface SeedOrderContext {
	locationIds: LocationIds
	userIds: UserIds
	menuItemIds: MenuItemIds
	paymentMethodIds: PaymentMethodIds
	tableIds: TableIds
	modifierOptionIds: ModifierOptionIds
}

export async function seedSampleOrder(sql: Sql, ctx: SeedOrderContext): Promise<void> {
	console.log('  → Seeding sample order...')

	const { locationIds, userIds, menuItemIds, paymentMethodIds, tableIds, modifierOptionIds } = ctx

	// 1. Seed initial stock balances (so deduction demo is meaningful)
	console.log('    • Seeding initial stock balances...')
	await seedInitialStock(sql, locationIds)

	// 2. Open a cashier shift
	console.log('    • Opening cashier shift...')
	const [shift] = await sql`
		INSERT INTO cashier_shifts (location_id, user_id, status, opening_cash)
		VALUES (${locationIds.store}, ${userIds.cashier}, 'open', '500000.00')
		RETURNING id
	`
	const shiftId = shift!.id as number

	// 3. Create order (dine_in at table A1)
	console.log('    • Creating order...')
	const orderNo = 'ORD-20260808-0001'
	// Line totals:
	// Line 1: Iced Latte (28000) + Large modifier (5000) = 33000
	// Line 2: Hot Americano (22000) = 22000
	// Line 3: Croissant (18000) = 18000
	// subtotal = 33000 + 22000 + 18000 = 73000
	const actualSubtotal = '73000.00'
	const taxAmount = '8030.00' // 11% of 73000
	const total = '81030.00'

	const [order] = await sql`
		INSERT INTO orders (order_no, location_id, table_id, shift_id, type, status, subtotal, discount_amount, tax_amount, total, source, ordered_at, completed_at, created_by, updated_by)
		VALUES (
			${orderNo},
			${locationIds.store},
			${tableIds.a1},
			${shiftId},
			'dine_in',
			'completed',
			${actualSubtotal},
			'0.00',
			${taxAmount},
			${total},
			'internal',
			NOW() - INTERVAL '30 minutes',
			NOW() - INTERVAL '5 minutes',
			${userIds.cashier},
			${userIds.cashier}
		)
		RETURNING id
	`
	const orderId = order!.id as number

	// 4. Order lines
	console.log('    • Adding order lines...')
	const modifiersJson = JSON.stringify([
		{
			groupName: 'Size',
			optionName: 'Large',
			optionId: modifierOptionIds.sizeLarge,
			priceAdjustment: 5000,
		},
		{
			groupName: 'Ice Level',
			optionName: 'Less Ice',
			optionId: modifierOptionIds.iceLess,
			priceAdjustment: 0,
		},
		{
			groupName: 'Sugar Level',
			optionName: 'Normal Sugar',
			optionId: modifierOptionIds.sugarNormal,
			priceAdjustment: 0,
		},
	])

	await sql`
		INSERT INTO order_lines (order_id, menu_item_id, menu_item_name, quantity, unit_price, modifiers, modifier_total, discount_amount, line_total, status)
		VALUES
			(${orderId}, ${menuItemIds.icedLatte}, 'Iced Latte', '1.000000', '28000.00', ${modifiersJson}::jsonb, '5000.00', '0.00', '33000.00', 'active'),
			(${orderId}, ${menuItemIds.hotAmericano}, 'Hot Americano', '1.000000', '22000.00', NULL, '0.00', '0.00', '22000.00', 'active'),
			(${orderId}, ${menuItemIds.croissant}, 'Croissant', '1.000000', '18000.00', NULL, '0.00', '0.00', '18000.00', 'active')
	`

	// 5. Payment (cash — full amount)
	console.log('    • Recording payment...')
	await sql`
		INSERT INTO payments (order_id, payment_method_id, amount)
		VALUES (${orderId}, ${paymentMethodIds.cash}, ${total})
	`

	// 6. Stock movements for the order (deduction for drinks with recipes)
	console.log('    • Recording stock movements...')

	// Lookup material IDs from DB to insert movements
	const mats = await sql`SELECT id, code FROM materials ORDER BY id`
	const coffeeMat = mats.find((m) => m.code === 'MAT-001')!.id
	const freshMilkMat = mats.find((m) => m.code === 'MAT-004')!.id
	const sugarMat = mats.find((m) => m.code === 'MAT-006')!.id
	const iceMat = mats.find((m) => m.code === 'MAT-008')!.id

	await sql`
		INSERT INTO stock_movements (material_id, location_id, type, direction, quantity, cost_price, reference_type, reference_id, created_by)
		VALUES
			(${coffeeMat}, ${locationIds.store}, 'order_deduction', 'out', '0.020000', '185000.000000', 'order', ${orderId}, ${userIds.cashier}),
			(${freshMilkMat}, ${locationIds.store}, 'order_deduction', 'out', '200.000000', '18.000000', 'order', ${orderId}, ${userIds.cashier}),
			(${iceMat}, ${locationIds.store}, 'order_deduction', 'out', '0.100000', '5000.000000', 'order', ${orderId}, ${userIds.cashier}),
			(${sugarMat}, ${locationIds.store}, 'order_deduction', 'out', '0.010000', '14000.000000', 'order', ${orderId}, ${userIds.cashier}),
			(${coffeeMat}, ${locationIds.store}, 'order_deduction', 'out', '0.020000', '185000.000000', 'order', ${orderId}, ${userIds.cashier})
	`

	console.log(`    • Sample order ${orderNo} completed (total: Rp ${total})`)
}

// ─── Initial Stock Balances ───

async function seedInitialStock(sql: Sql, locationIds: LocationIds): Promise<void> {
	// Seed realistic starting stock at the store
	const mats = await sql`SELECT id, code FROM materials ORDER BY id`

	const stockData = [
		// material_id, location_id, quantity, cost_price
		{ code: 'MAT-001', qty: '5.000000', cost: '185000.000000' }, // Coffee 5kg
		{ code: 'MAT-002', qty: '1000.000000', cost: '120.000000' }, // Green Tea 1kg (in g)
		{ code: 'MAT-003', qty: '500.000000', cost: '350.000000' }, // Matcha 500g
		{ code: 'MAT-004', qty: '10000.000000', cost: '18.000000' }, // Fresh Milk 10L (in ml)
		{ code: 'MAT-005', qty: '5000.000000', cost: '25.000000' }, // Condensed Milk 5L (in ml)
		{ code: 'MAT-006', qty: '10.000000', cost: '14000.000000' }, // Sugar 10kg
		{ code: 'MAT-007', qty: '2000.000000', cost: '28.000000' }, // Brown Sugar 2kg (in g)
		{ code: 'MAT-008', qty: '20.000000', cost: '5000.000000' }, // Ice 20kg
		{ code: 'MAT-009', qty: '3000.000000', cost: '45.000000' }, // Choco Sauce 3L (in ml)
		{ code: 'MAT-010', qty: '3000.000000', cost: '55.000000' }, // Vanilla Syrup 3L (in ml)
		{ code: 'MAT-011', qty: '500.000000', cost: '850.000000' }, // Plastic Cup 500pcs
		{ code: 'MAT-012', qty: '500.000000', cost: '1200.000000' }, // Paper Cup 500pcs
	]

	const rows: [number, number, string, string][] = []
	for (const s of stockData) {
		const mat = mats.find((m) => m.code === s.code)
		if (mat) {
			rows.push([mat.id as number, locationIds.store, s.qty, s.cost])
		}
	}

	await sql`
		INSERT INTO stock_balances (material_id, location_id, quantity, cost_price)
		VALUES ${sql(rows)}
	`
}

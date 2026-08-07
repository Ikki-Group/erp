import { pgTable, varchar, numeric, integer, jsonb, timestamp, check, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'
import { users } from './iam.ts'
import { menuItems } from './menu.ts'

// ─── Payment Methods ───

export const paymentMethods = pgTable(
	'payment_methods',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		type: varchar('type', { length: 20 }).notNull(),
		isActive: integer('is_active').notNull().default(1),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('payment_methods_code_uniq').on(t.code),
		check('payment_methods_type_chk', sql`${t.type} IN ('cash', 'digital')`),
	],
)

// ─── Payment Method Locations ───

export const paymentMethodLocations = pgTable(
	'payment_method_locations',
	{
		...pk,
		paymentMethodId: integer('payment_method_id').notNull().references(() => paymentMethods.id, { onDelete: 'cascade' }),
		locationId: integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
		isEnabled: integer('is_enabled').notNull().default(1),
	},
	(t) => [
		uniqueIndex('payment_method_locations_method_location_uniq').on(t.paymentMethodId, t.locationId),
		index('payment_method_locations_payment_method_id_idx').on(t.paymentMethodId),
		index('payment_method_locations_location_id_idx').on(t.locationId),
	],
)

// ─── Tables ───

export const tables = pgTable(
	'tables',
	{
		...pk,
		locationId: integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
		number: varchar('number', { length: 50 }).notNull(),
		capacity: integer('capacity').notNull().default(4),
		status: varchar('status', { length: 20 }).notNull().default('available'),
		isActive: integer('is_active').notNull().default(1),
	},
	(t) => [
		uniqueIndex('tables_location_number_uniq').on(t.locationId, t.number),
		check('tables_status_chk', sql`${t.status} IN ('available', 'occupied', 'reserved')`),
		index('tables_location_id_idx').on(t.locationId),
	],
)

// ─── Cashier Shifts ───

export const cashierShifts = pgTable(
	'cashier_shifts',
	{
		...pk,
		locationId: integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
		userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
		status: varchar('status', { length: 20 }).notNull().default('open'),
		openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
		closedAt: timestamp('closed_at', { withTimezone: true }),
		openingCash: numeric('opening_cash', { precision: 18, scale: 2 }).notNull().default('0'),
		closingCash: numeric('closing_cash', { precision: 18, scale: 2 }),
		expectedCash: numeric('expected_cash', { precision: 18, scale: 2 }),
		notes: varchar('notes', { length: 1000 }),
	},
	(t) => [
		check('cashier_shifts_status_chk', sql`${t.status} IN ('open', 'closed')`),
		index('cashier_shifts_location_id_idx').on(t.locationId),
		index('cashier_shifts_user_id_idx').on(t.userId),
	],
)

// ─── Orders ───

export const orders = pgTable(
	'orders',
	{
		...pk,
		orderNo: varchar('order_no', { length: 100 }).notNull(),
		locationId: integer('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
		tableId: integer('table_id').references(() => tables.id, { onDelete: 'set null' }),
		shiftId: integer('shift_id').notNull().references(() => cashierShifts.id, { onDelete: 'restrict' }),
		type: varchar('type', { length: 20 }).notNull(),
		billingMode: varchar('billing_mode', { length: 20 }).notNull().default('open'),
		status: varchar('status', { length: 20 }).notNull().default('open'),
		subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		total: numeric('total', { precision: 18, scale: 2 }).notNull().default('0'),
		customerId: integer('customer_id'),
		source: varchar('source', { length: 20 }).notNull().default('internal'),
		externalRef: varchar('external_ref', { length: 255 }),
		notes: varchar('notes', { length: 1000 }),
		orderedAt: timestamp('ordered_at', { withTimezone: true }).notNull().defaultNow(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('orders_order_no_uniq').on(t.orderNo),
		uniqueIndex('orders_external_ref_uniq').on(t.externalRef).where(sql`${t.externalRef} IS NOT NULL`),
		check('orders_type_chk', sql`${t.type} IN ('dine_in', 'takeaway')`),
		check('orders_status_chk', sql`${t.status} IN ('open', 'completed', 'voided')`),
		check('orders_source_chk', sql`${t.source} IN ('internal', 'moka', 'manual')`),
		index('orders_location_status_ordered_idx').on(t.locationId, t.status, t.orderedAt),
		index('orders_table_id_idx').on(t.tableId),
		index('orders_shift_id_idx').on(t.shiftId),
	],
)

// ─── Order Lines ───

export const orderLines = pgTable(
	'order_lines',
	{
		...pk,
		orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
		menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'restrict' }),
		menuItemName: varchar('menu_item_name', { length: 255 }).notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
		modifiers: jsonb('modifiers'),
		modifierTotal: numeric('modifier_total', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull(),
		status: varchar('status', { length: 20 }).notNull().default('active'),
		notes: varchar('notes', { length: 500 }),
		voidedBy: integer('voided_by').references(() => users.id, { onDelete: 'set null' }),
		voidedAt: timestamp('voided_at', { withTimezone: true }),
	},
	(t) => [
		check('order_lines_status_chk', sql`${t.status} IN ('active', 'voided')`),
		index('order_lines_order_id_idx').on(t.orderId),
		index('order_lines_menu_item_id_idx').on(t.menuItemId),
	],
)

// ─── Payments ───

export const payments = pgTable(
	'payments',
	{
		...pk,
		orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
		paymentMethodId: integer('payment_method_id').notNull().references(() => paymentMethods.id, { onDelete: 'restrict' }),
		amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
		reference: varchar('reference', { length: 255 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('payments_order_id_idx').on(t.orderId),
		index('payments_payment_method_id_idx').on(t.paymentMethodId),
	],
)

import {
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { invoiceStatusEnum, salesOrderSourceEnum, salesOrderStatusEnum } from './_helpers'
import { customersTable } from './customer'
import { locationsTable } from './location'
import { productsTable, productVariantsTable, salesTypesTable } from './product'

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export const salesOrdersTable = pgTable(
	'sales_orders',
	{
		...pk,
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		// CRM Integration
		customerId: integer().references(() => customersTable.id, { onDelete: 'set null' }),
		salesTypeId: integer()
			.notNull()
			.references(() => salesTypesTable.id, { onDelete: 'restrict' }),
		source: salesOrderSourceEnum().notNull().default('web'),
		status: salesOrderStatusEnum().notNull().default('open'),

		transactionDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),

		// Financial numbers
		totalAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		gratuityAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		refundAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		// Moka / third-party sync metadata (split_payment_details, payment_type, etc.)
		metadata: jsonb(),

		...auditColumns,
	},
	(t) => [
		index('sales_orders_location_idx').on(t.locationId),
		index('sales_orders_source_idx').on(t.source),
		index('sales_orders_status_idx').on(t.status),
		index('sales_orders_transaction_date_idx').on(t.transactionDate),
		index('sales_orders_customer_idx').on(t.customerId),
	],
)

// ─── Sales Order Batches ──────────────────────────────────────────────────────

export const salesOrderBatchesTable = pgTable(
	'sales_order_batches',
	{
		...pk,
		orderId: integer()
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		batchNumber: numeric({ precision: 5, scale: 0 }).notNull(),
		// E.g., pending, prepared, delivered
		status: text().notNull().default('pending'),
		...auditColumns,
	},
	(t) => [index('sales_order_batches_order_idx').on(t.orderId)],
)

// ─── Sales Order Items ────────────────────────────────────────────────────────

export const salesOrderItemsTable = pgTable(
	'sales_order_items',
	{
		...pk,
		orderId: integer()
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		batchId: integer().references(() => salesOrderBatchesTable.id, { onDelete: 'set null' }),

		// Custom Items: products/variants optional
		productId: integer().references(() => productsTable.id, { onDelete: 'set null' }),
		variantId: integer().references(() => productVariantsTable.id, { onDelete: 'set null' }),

		// Immutable History: Item name must always be stored
		itemName: text().notNull(),

		// Qty keeps scale 4 for fractional cases
		quantity: numeric({ precision: 18, scale: 4 }).notNull().default('1'),

		// Immutable Financial History (scale 2)
		unitPrice: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		...auditColumns,
	},
	(t) => [
		index('sales_order_items_order_idx').on(t.orderId),
		index('sales_order_items_product_idx').on(t.productId),
		index('sales_order_items_variant_idx').on(t.variantId),
		index('sales_order_items_batch_idx').on(t.batchId),
	],
)

// ─── Sales Invoices ───────────────────────────────────────────────────────────

export const salesInvoicesTable = pgTable(
	'sales_invoices',
	{
		...pk,
		orderId: integer()
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'restrict' }),
		customerId: integer().references(() => customersTable.id, { onDelete: 'set null' }),
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		status: invoiceStatusEnum().notNull().default('draft'),
		invoiceDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
		dueDate: timestamp({ mode: 'date', withTimezone: true }),

		totalAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		notes: text(),
		...auditColumns,
	},
	(t) => [
		index('sales_invoices_order_idx').on(t.orderId),
		index('sales_invoices_customer_idx').on(t.customerId),
		index('sales_invoices_status_idx').on(t.status),
	],
)

// ─── Sales Invoice Items ──────────────────────────────────────────────────────

export const salesInvoiceItemsTable = pgTable(
	'sales_invoice_items',
	{
		...pk,
		invoiceId: integer()
			.notNull()
			.references(() => salesInvoicesTable.id, { onDelete: 'cascade' }),
		salesOrderItemId: integer().references(() => salesOrderItemsTable.id, {
			onDelete: 'set null',
		}),
		productId: integer().references(() => productsTable.id, { onDelete: 'set null' }),
		variantId: integer().references(() => productVariantsTable.id, { onDelete: 'set null' }),

		itemName: text().notNull(),
		quantity: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		unitPrice: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		...auditColumns,
	},
	(t) => [
		index('sales_invoice_items_invoice_idx').on(t.invoiceId),
		index('sales_invoice_items_so_item_idx').on(t.salesOrderItemId),
	],
)

// ─── Sales Voids ──────────────────────────────────────────────────────────────

export const salesVoidsTable = pgTable(
	'sales_voids',
	{
		...pk,
		orderId: integer()
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		// If itemId is null, it means the whole order is voided
		itemId: integer().references(() => salesOrderItemsTable.id, { onDelete: 'cascade' }),
		reason: text(),
		voidedBy: integer().notNull(),
		// Raw void data from third-party (Moka item_name, void_by, uuid, etc.)
		metadata: jsonb(),

		...auditColumns,
	},
	(t) => [index('sales_voids_order_idx').on(t.orderId), index('sales_voids_item_idx').on(t.itemId)],
)

// ─── Sales External Refs ──────────────────────────────────────────────────────

export const salesExternalRefsTable = pgTable(
	'sales_external_refs',
	{
		...pk,
		orderId: integer()
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		// 'Grab', 'Shopee', 'Moka', etc.
		externalSource: text().notNull(),
		externalOrderId: text().notNull(),
		rawPayload: jsonb(),
		...auditColumns,
	},
	(t) => [
		uniqueIndex('sales_external_refs_source_ext_id_idx').on(t.externalSource, t.externalOrderId),
		index('sales_external_refs_order_idx').on(t.orderId),
	],
)

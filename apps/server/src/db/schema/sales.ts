import { gt, gte } from 'drizzle-orm'
import {
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { invoiceStatusEnum } from './_enums'
import { auditBasicColumns, pk } from './_helpers'
import { customersTable } from './crm'
import { usersTable } from './iam'
import { locationsTable } from './location'
import { productsTable, productVariantsTable } from './product'
import { salesTypesTable } from './sales-type'

export const salesOrderStatusEnum = pgEnum('sales_order_status', ['open', 'closed', 'void'])
export const salesOrderSourceEnum = pgEnum('sales_order_source', [
	'web',
	'moka',
	'upload',
	'machine_fetch',
])
export const salesPaymentStatusEnum = pgEnum('sales_payment_status', ['unpaid', 'partial', 'paid'])
export const batchStatusEnum = pgEnum('batch_status', [
	'pending',
	'prepared',
	'delivered',
	'cancelled',
])

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export const salesOrdersTable = pgTable(
	'sales_orders',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		// CRM Integration
		customerId: integer('customer_id').references(() => customersTable.id, {
			onDelete: 'set null',
		}),
		salesTypeId: integer('sales_type_id')
			.notNull()
			.references(() => salesTypesTable.id, { onDelete: 'restrict' }),
		source: salesOrderSourceEnum('source').notNull().default('web'),
		status: salesOrderStatusEnum('status').notNull().default('open'),

		transactionDate: timestamp('transaction_date', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),

		// Financial numbers
		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		gratuityAmount: numeric('gratuity_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		refundAmount: numeric('refund_amount', { precision: 18, scale: 2 }).notNull().default('0'),

		// Payment tracking (denormalized from payment_invoices for dashboard performance)
		paymentStatus: salesPaymentStatusEnum('payment_status').notNull().default('unpaid'),
		paidAmount: numeric('paid_amount', { precision: 18, scale: 2 }).notNull().default('0'),

		// Moka / third-party sync metadata (split_payment_details, payment_type, etc.)
		metadata: jsonb('metadata'),

		...auditBasicColumns,
	},
	(t) => [
		index('sales_orders_location_idx').on(t.locationId),
		index('sales_orders_source_idx').on(t.source),
		index('sales_orders_status_idx').on(t.status),
		index('sales_orders_transaction_date_idx').on(t.transactionDate),
		index('sales_orders_customer_idx').on(t.customerId),
		index('sales_orders_sales_type_idx').on(t.salesTypeId),
		index('sales_orders_payment_status_idx').on(t.paymentStatus),

		// Financial amounts must be non-negative
		check('sales_orders_total_nonneg_chk', gte(t.totalAmount, 0)),
		check('sales_orders_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('sales_orders_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('sales_orders_gratuity_nonneg_chk', gte(t.gratuityAmount, 0)),
		check('sales_orders_refund_nonneg_chk', gte(t.refundAmount, 0)),
		check('sales_orders_paid_nonneg_chk', gte(t.paidAmount, 0)),
	],
)

// ─── Sales Order Batches ──────────────────────────────────────────────────────

export const salesOrderBatchesTable = pgTable(
	'sales_order_batches',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		batchNumber: numeric('batch_number', { precision: 5, scale: 0 }).notNull(),
		status: batchStatusEnum('status').notNull().default('pending'),
		...auditBasicColumns,
	},
	(t) => [index('sales_order_batches_order_idx').on(t.orderId)],
)

// ─── Sales Order Items ────────────────────────────────────────────────────────

export const salesOrderItemsTable = pgTable(
	'sales_order_items',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		batchId: integer('batch_id').references(() => salesOrderBatchesTable.id, {
			onDelete: 'set null',
		}),

		// Custom Items: products/variants optional
		productId: integer('product_id').references(() => productsTable.id, { onDelete: 'set null' }),
		variantId: integer('variant_id').references(() => productVariantsTable.id, {
			onDelete: 'set null',
		}),

		// Immutable History: Item name must always be stored
		itemName: text('item_name').notNull(),
		/** Snapshot of product SKU at time of sale (decouples from product renames) */
		productSku: text('product_sku'),
		/** Snapshot of variant name at time of sale */
		variantName: text('variant_name'),

		// Qty keeps scale 6 (matches inventory.ts)
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('1'),

		// Immutable Financial History (scale 2)
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),

		...auditBasicColumns,
	},
	(t) => [
		index('sales_order_items_order_idx').on(t.orderId),
		index('sales_order_items_product_idx').on(t.productId),
		index('sales_order_items_variant_idx').on(t.variantId),
		index('sales_order_items_batch_idx').on(t.batchId),

		// Quantity must be positive
		check('sales_order_items_qty_pos_chk', gt(t.quantity, 0)),
		// Financial fields must be non-negative
		check('sales_order_items_unit_price_nonneg_chk', gte(t.unitPrice, 0)),
		check('sales_order_items_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('sales_order_items_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('sales_order_items_subtotal_nonneg_chk', gte(t.subtotal, 0)),
	],
)

// ─── Sales Voids ──────────────────────────────────────────────────────────────

export const salesVoidsTable = pgTable(
	'sales_voids',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		// If itemId is null, it means the whole order is voided
		itemId: integer('item_id').references(() => salesOrderItemsTable.id, { onDelete: 'cascade' }),
		reason: text('reason'),
		voidedBy: integer('voided_by').references(() => usersTable.id, { onDelete: 'set null' }),
		metadata: jsonb('metadata'),
		...auditBasicColumns,
	},
	(t) => [index('sales_voids_order_idx').on(t.orderId), index('sales_voids_item_idx').on(t.itemId)],
)

// ─── Sales Refunds ────────────────────────────────────────────────────────────

export const salesRefundsTable = pgTable(
	'sales_refunds',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		// If itemId is null, it's an order-level refund
		itemId: integer('item_id').references(() => salesOrderItemsTable.id, { onDelete: 'cascade' }),
		amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
		reason: text('reason'),
		refundedBy: integer('refunded_by').references(() => usersTable.id, { onDelete: 'set null' }),
		refundedAt: timestamp('refunded_at', { mode: 'date', withTimezone: true }).notNull(),
		metadata: jsonb('metadata'),
		...auditBasicColumns,
	},
	(t) => [
		index('sales_refunds_order_idx').on(t.orderId),
		index('sales_refunds_item_idx').on(t.itemId),
		index('sales_refunds_date_idx').on(t.refundedAt),

		// Refund amount must be positive
		check('sales_refunds_amount_pos_chk', gt(t.amount, 0)),
	],
)

// ─── Sales External Refs ──────────────────────────────────────────────────────

export const salesExternalRefsTable = pgTable(
	'sales_external_refs',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
		// 'Grab', 'Shopee', 'Moka', etc.
		externalSource: text('external_source').notNull(),
		externalOrderId: text('external_order_id').notNull(),
		rawPayload: jsonb('raw_payload'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('sales_external_refs_source_ext_id_idx').on(t.externalSource, t.externalOrderId),
		index('sales_external_refs_order_idx').on(t.orderId),
	],
)

// ─── Sales Invoices ───────────────────────────────────────────────────────────

export const salesInvoicesTable = pgTable(
	'sales_invoices',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => salesOrdersTable.id, { onDelete: 'restrict' }),
		customerId: integer('customer_id').references(() => customersTable.id, {
			onDelete: 'set null',
		}),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		status: invoiceStatusEnum('status').notNull().default('draft'),
		invoiceDate: timestamp('invoice_date', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),
		dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),

		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),

		notes: text('notes'),
		...auditBasicColumns,
	},
	(t) => [
		index('sales_invoices_order_idx').on(t.orderId),
		index('sales_invoices_customer_idx').on(t.customerId),
		index('sales_invoices_status_idx').on(t.status),

		// Financial amounts must be non-negative
		check('sales_invoices_total_nonneg_chk', gte(t.totalAmount, 0)),
		check('sales_invoices_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('sales_invoices_discount_nonneg_chk', gte(t.discountAmount, 0)),
	],
)

// ─── Sales Invoice Items ──────────────────────────────────────────────────────

export const salesInvoiceItemsTable = pgTable(
	'sales_invoice_items',
	{
		...pk,
		invoiceId: integer('invoice_id')
			.notNull()
			.references(() => salesInvoicesTable.id, { onDelete: 'cascade' }),
		salesOrderItemId: integer('sales_order_item_id').references(() => salesOrderItemsTable.id, {
			onDelete: 'set null',
		}),
		productId: integer('product_id').references(() => productsTable.id, { onDelete: 'set null' }),
		variantId: integer('variant_id').references(() => productVariantsTable.id, {
			onDelete: 'set null',
		}),

		itemName: text('item_name').notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('0'),
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),

		...auditBasicColumns,
	},
	(t) => [
		index('sales_invoice_items_invoice_idx').on(t.invoiceId),
		index('sales_invoice_items_so_item_idx').on(t.salesOrderItemId),
		index('sales_invoice_items_product_idx').on(t.productId),
		index('sales_invoice_items_variant_idx').on(t.variantId),

		// Quantity must be positive
		check('sales_invoice_items_qty_pos_chk', gt(t.quantity, 0)),
		// Financial fields must be non-negative
		check('sales_invoice_items_unit_price_nonneg_chk', gte(t.unitPrice, 0)),
		check('sales_invoice_items_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('sales_invoice_items_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('sales_invoice_items_subtotal_nonneg_chk', gte(t.subtotal, 0)),
	],
)

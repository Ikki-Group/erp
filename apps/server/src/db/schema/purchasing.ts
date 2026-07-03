import { check, index, integer, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { gt, gte } from 'drizzle-orm'

import { auditFullColumns, pk } from './_helpers'
import { invoiceStatusEnum } from './_enums'
import { locationsTable } from './location'
import { materialsTable } from './material'
import { suppliersTable } from './supplier'

export const purchaseRequestStatusEnum = pgEnum('purchase_request_status', ['open', 'approved', 'rejected', 'void'])

/**
 * ⚠ Schema-only for now: no repo/service implements this table yet
 * (see `purchaseOrdersTable` below — purchase orders have an optional
 * `requestId` FK for when this workflow stage is built, but nothing creates
 * purchase requests today). Kept because the FK already exists on
 * `purchase_orders` and dropping it would be a breaking schema change for no
 * reason — just don't build a repo against this until the PR workflow is
 * actually wired up in the modules layer.
 */
export const purchaseRequestsTable = pgTable(
	'purchase_requests',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		// User who requested (relates to usersTable but we keep integer constraint)
		requestedBy: integer('requested_by').notNull(),
		status: purchaseRequestStatusEnum('status').notNull().default('open'),

		requestDate: timestamp('request_date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		expectedDate: timestamp('expected_date', { mode: 'date', withTimezone: true }),
		notes: text('notes'),

		...auditFullColumns,
	},
	(t) => [
		index('purchase_requests_location_idx').on(t.locationId),
		index('purchase_requests_status_idx').on(t.status),
	],
)

export const purchaseRequestItemsTable = pgTable(
	'purchase_request_items',
	{
		...pk,
		requestId: integer('request_id')
			.notNull()
			.references(() => purchaseRequestsTable.id, { onDelete: 'cascade' }),
		materialId: integer('material_id').references(() => materialsTable.id, { onDelete: 'set null' }),

		itemName: text('item_name').notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('1'),
		notes: text('notes'),

		...auditFullColumns,
	},
	(t) => [
		index('purchase_request_items_request_idx').on(t.requestId),
		index('purchase_request_items_material_idx').on(t.materialId),

		// Quantity must be positive
		check('purchase_request_items_qty_pos_chk', gt(t.quantity, 0)),
	],
)

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
	'pending_approval',
	'approved',
	'rejected',
	'open',
	'closed',
	'void',
])

export const purchaseOrdersTable = pgTable(
	'purchase_orders',
	{
		...pk,
		// PR -> PO link
		requestId: integer('request_id').references(() => purchaseRequestsTable.id, { onDelete: 'set null' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		supplierId: integer('supplier_id')
			.notNull()
			.references(() => suppliersTable.id, { onDelete: 'restrict' }),
		status: purchaseOrderStatusEnum('status').notNull().default('open'),

		// PRs are turned to PO. PO is a promise to buy.
		transactionDate: timestamp('transaction_date', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),
		expectedDeliveryDate: timestamp('expected_delivery_date', { mode: 'date', withTimezone: true }),

		// Financial numbers
		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		notes: text('notes'),

		...auditFullColumns,
	},
	(t) => [
		index('purchase_orders_location_idx').on(t.locationId),
		index('purchase_orders_supplier_idx').on(t.supplierId),
		index('purchase_orders_status_idx').on(t.status),
		index('purchase_orders_request_idx').on(t.requestId),

		// Financial amounts must be non-negative
		check('purchase_orders_total_nonneg_chk', gte(t.totalAmount, 0)),
		check('purchase_orders_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('purchase_orders_tax_nonneg_chk', gte(t.taxAmount, 0)),
	],
)

export const purchaseOrderItemsTable = pgTable(
	'purchase_order_items',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => purchaseOrdersTable.id, { onDelete: 'cascade' }),
		requestItemId: integer('request_item_id').references(() => purchaseRequestItemsTable.id, {
			onDelete: 'set null',
		}),

		materialId: integer('material_id').references(() => materialsTable.id, { onDelete: 'set null' }),

		// Immutable History: Item name must always be stored
		itemName: text('item_name').notNull(),

		// Qty keeps scale 6 (matches inventory.ts)
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('1'),

		// Financial lock (Price Lock)
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),

		...auditFullColumns,
	},
	(t) => [
		index('purchase_order_items_order_idx').on(t.orderId),
		index('purchase_order_items_material_idx').on(t.materialId),
		index('purchase_order_items_request_item_idx').on(t.requestItemId),

		// Quantity must be positive
		check('purchase_order_items_qty_pos_chk', gt(t.quantity, 0)),
		// Financial fields must be non-negative
		check('purchase_order_items_unit_price_nonneg_chk', gte(t.unitPrice, 0)),
		check('purchase_order_items_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('purchase_order_items_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('purchase_order_items_subtotal_nonneg_chk', gte(t.subtotal, 0)),
	],
)

// ─── Goods Receipt Notes ──────────────────────────────────────────────────────

export const goodsReceiptStatusEnum = pgEnum('goods_receipt_status', ['open', 'completed', 'void'])

export const goodsReceiptNotesTable = pgTable(
	'goods_receipt_notes',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => purchaseOrdersTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		supplierId: integer('supplier_id')
			.notNull()
			.references(() => suppliersTable.id, { onDelete: 'restrict' }),

		receiveDate: timestamp('receive_date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		status: goodsReceiptStatusEnum('status').notNull().default('open'),

		// External reference (e.g., supplier's delivery note number)
		referenceNumber: text('reference_number'),
		notes: text('notes'),

		...auditFullColumns,
	},
	(t) => [
		index('goods_receipt_notes_order_idx').on(t.orderId),
		index('goods_receipt_notes_location_idx').on(t.locationId),
		index('goods_receipt_notes_supplier_idx').on(t.supplierId),
		index('goods_receipt_notes_status_idx').on(t.status),
	],
)

export const goodsReceiptNoteItemsTable = pgTable(
	'goods_receipt_note_items',
	{
		...pk,
		grnId: integer('grn_id')
			.notNull()
			.references(() => goodsReceiptNotesTable.id, { onDelete: 'cascade' }),
		purchaseOrderItemId: integer('purchase_order_item_id')
			.notNull()
			.references(() => purchaseOrderItemsTable.id, { onDelete: 'restrict' }),

		materialId: integer('material_id').references(() => materialsTable.id, { onDelete: 'set null' }),

		itemName: text('item_name').notNull(),
		quantityReceived: numeric('quantity_received', { precision: 18, scale: 6 }).notNull().default('0'),

		notes: text('notes'),

		...auditFullColumns,
	},
	(t) => [
		index('goods_receipt_note_items_grn_idx').on(t.grnId),
		index('goods_receipt_note_items_po_item_idx').on(t.purchaseOrderItemId),
		index('goods_receipt_note_items_material_idx').on(t.materialId),

		// Quantity received must be positive
		check('goods_receipt_note_items_qty_pos_chk', gt(t.quantityReceived, 0)),
	],
)

// ─── Purchase Invoices ────────────────────────────────────────────────────────

/**
 * ⚠ Schema-only for now: no repo/service implements this table yet.
 * PO/GRN stages are wired up; invoicing (AP) is not — the
 * `paymentInvoicesTable` FK to this table exists in anticipation of it.
 */
export const purchaseInvoicesTable = pgTable(
	'purchase_invoices',
	{
		...pk,
		orderId: integer('order_id')
			.notNull()
			.references(() => purchaseOrdersTable.id, { onDelete: 'restrict' }),
		supplierId: integer('supplier_id')
			.notNull()
			.references(() => suppliersTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		status: invoiceStatusEnum('status').notNull().default('draft'),
		invoiceDate: timestamp('invoice_date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),

		// Supplier's Invoice Number
		externalInvoiceNumber: text('external_invoice_number'),

		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),

		notes: text('notes'),
		...auditFullColumns,
	},
	(t) => [
		index('purchase_invoices_order_idx').on(t.orderId),
		index('purchase_invoices_supplier_idx').on(t.supplierId),
		index('purchase_invoices_status_idx').on(t.status),

		// Financial amounts must be non-negative
		check('purchase_invoices_total_nonneg_chk', gte(t.totalAmount, 0)),
		check('purchase_invoices_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('purchase_invoices_discount_nonneg_chk', gte(t.discountAmount, 0)),
	],
)

export const purchaseInvoiceItemsTable = pgTable(
	'purchase_invoice_items',
	{
		...pk,
		invoiceId: integer('invoice_id')
			.notNull()
			.references(() => purchaseInvoicesTable.id, { onDelete: 'cascade' }),
		purchaseOrderItemId: integer('purchase_order_item_id').references(() => purchaseOrderItemsTable.id, {
			onDelete: 'set null',
		}),
		materialId: integer('material_id').references(() => materialsTable.id, { onDelete: 'set null' }),

		itemName: text('item_name').notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('0'),
		unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
		taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),

		...auditFullColumns,
	},
	(t) => [
		index('purchase_invoice_items_invoice_idx').on(t.invoiceId),
		index('purchase_invoice_items_po_item_idx').on(t.purchaseOrderItemId),
		index('purchase_invoice_items_material_idx').on(t.materialId),

		// Quantity must be positive
		check('purchase_invoice_items_qty_pos_chk', gt(t.quantity, 0)),
		// Financial fields must be non-negative
		check('purchase_invoice_items_unit_price_nonneg_chk', gte(t.unitPrice, 0)),
		check('purchase_invoice_items_tax_nonneg_chk', gte(t.taxAmount, 0)),
		check('purchase_invoice_items_discount_nonneg_chk', gte(t.discountAmount, 0)),
		check('purchase_invoice_items_subtotal_nonneg_chk', gte(t.subtotal, 0)),
	],
)

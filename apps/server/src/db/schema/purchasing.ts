import { index, integer, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { locationsTable } from './location'
import { materialsTable } from './material'
import { suppliersTable } from './supplier'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const purchaseRequestStatusEnum = pgEnum('purchase_request_status', ['open', 'approved', 'rejected', 'void'])
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['open', 'closed', 'void'])
export const goodsReceiptStatusEnum = pgEnum('goods_receipt_status', ['open', 'completed', 'void'])

// ─── Purchase Requests ────────────────────────────────────────────────────────

export const purchaseRequestsTable = pgTable(
  'purchase_requests',
  {
    ...pk,
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    // User who requested (relates to usersTable but we keep integer constraint)
    requestedBy: integer().notNull(),
    status: purchaseRequestStatusEnum().notNull().default('open'),

    requestDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expectedDate: timestamp({ mode: 'date', withTimezone: true }),
    notes: text(),

    ...auditColumns,
  },
  (t) => [index('purchase_requests_location_idx').on(t.locationId), index('purchase_requests_status_idx').on(t.status)],
)

// ─── Purchase Request Items ───────────────────────────────────────────────────

export const purchaseRequestItemsTable = pgTable(
  'purchase_request_items',
  {
    ...pk,
    requestId: integer()
      .notNull()
      .references(() => purchaseRequestsTable.id, { onDelete: 'cascade' }),
    materialId: integer().references(() => materialsTable.id, { onDelete: 'set null' }),

    itemName: text().notNull(),
    quantity: numeric({ precision: 18, scale: 4 }).notNull().default('1'),
    notes: text(),

    ...auditColumns,
  },
  (t) => [
    index('purchase_request_items_request_idx').on(t.requestId),
    index('purchase_request_items_material_idx').on(t.materialId),
  ],
)

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const purchaseOrdersTable = pgTable(
  'purchase_orders',
  {
    ...pk,
    // PR -> PO link
    requestId: integer().references(() => purchaseRequestsTable.id, { onDelete: 'set null' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    supplierId: integer()
      .notNull()
      .references(() => suppliersTable.id, { onDelete: 'restrict' }),
    status: purchaseOrderStatusEnum().notNull().default('open'),

    // PRs are turned to PO. PO is a promise to buy.
    transactionDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expectedDeliveryDate: timestamp({ mode: 'date', withTimezone: true }),

    // Financial numbers
    totalAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    notes: text(),

    ...auditColumns,
  },
  (t) => [
    index('purchase_orders_location_idx').on(t.locationId),
    index('purchase_orders_supplier_idx').on(t.supplierId),
    index('purchase_orders_status_idx').on(t.status),
    index('purchase_orders_request_idx').on(t.requestId),
  ],
)

// ─── Purchase Order Items ─────────────────────────────────────────────────────

export const purchaseOrderItemsTable = pgTable(
  'purchase_order_items',
  {
    ...pk,
    orderId: integer()
      .notNull()
      .references(() => purchaseOrdersTable.id, { onDelete: 'cascade' }),
    requestItemId: integer().references(() => purchaseRequestItemsTable.id, { onDelete: 'set null' }),

    materialId: integer().references(() => materialsTable.id, { onDelete: 'set null' }),

    // Immutable History: Item name must always be stored
    itemName: text().notNull(),

    // Qty keeps scale 4 for fractional cases
    quantity: numeric({ precision: 18, scale: 4 }).notNull().default('1'),

    // Financial lock (Price Lock)
    unitPrice: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    subtotal: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

    ...auditColumns,
  },
  (t) => [
    index('purchase_order_items_order_idx').on(t.orderId),
    index('purchase_order_items_material_idx').on(t.materialId),
  ],
)
// ─── Goods Receipt Notes ──────────────────────────────────────────────────────

export const goodsReceiptNotesTable = pgTable(
  'goods_receipt_notes',
  {
    ...pk,
    orderId: integer()
      .notNull()
      .references(() => purchaseOrdersTable.id, { onDelete: 'restrict' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    supplierId: integer()
      .notNull()
      .references(() => suppliersTable.id, { onDelete: 'restrict' }),

    receiveDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    status: goodsReceiptStatusEnum().notNull().default('open'),

    // External reference (e.g., supplier's delivery note number)
    referenceNumber: text(),
    notes: text(),

    ...auditColumns,
  },
  (t) => [
    index('goods_receipt_notes_order_idx').on(t.orderId),
    index('goods_receipt_notes_location_idx').on(t.locationId),
    index('goods_receipt_notes_supplier_idx').on(t.supplierId),
    index('goods_receipt_notes_status_idx').on(t.status),
  ],
)

// ─── Goods Receipt Note Items ─────────────────────────────────────────────────

export const goodsReceiptNoteItemsTable = pgTable(
  'goods_receipt_note_items',
  {
    ...pk,
    grnId: integer()
      .notNull()
      .references(() => goodsReceiptNotesTable.id, { onDelete: 'cascade' }),
    purchaseOrderItemId: integer()
      .notNull()
      .references(() => purchaseOrderItemsTable.id, { onDelete: 'restrict' }),

    materialId: integer().references(() => materialsTable.id, { onDelete: 'set null' }),

    itemName: text().notNull(),
    quantityReceived: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    notes: text(),

    ...auditColumns,
  },
  (t) => [
    index('goods_receipt_note_items_grn_idx').on(t.grnId),
    index('goods_receipt_note_items_po_item_idx').on(t.purchaseOrderItemId),
    index('goods_receipt_note_items_material_idx').on(t.materialId),
  ],
)

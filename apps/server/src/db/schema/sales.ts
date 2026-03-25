import { index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'
import { locationsTable } from './location'
import { productsTable, productVariantsTable, salesTypesTable } from './product'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const salesOrderStatusEnum = pgEnum('sales_order_status', ['open', 'closed', 'void'])

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export const salesOrdersTable = pgTable(
  'sales_orders',
  {
    ...pk,
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    // CRM Integration future-proofing
    customerId: integer(),
    salesTypeId: integer()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    status: salesOrderStatusEnum().notNull().default('open'),

    transactionDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),

    // Financial numbers
    totalAmount: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    index('sales_orders_location_idx').on(t.locationId),
    index('sales_orders_status_idx').on(t.status),
    index('sales_orders_transaction_date_idx').on(t.transactionDate),
  ]
)

// ─── Sales Order Batches ──────────────────────────────────────────────────────

export const salesOrderBatchesTable = pgTable(
  'sales_order_batches',
  {
    ...pk,
    orderId: integer()
      .notNull()
      .references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
    batchNumber: integer().notNull(),
    status: text().notNull().default('pending'), // E.g., pending, prepared, delivered
    ...metadata,
  },
  (t) => [index('sales_order_batches_order_idx').on(t.orderId)]
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

    quantity: numeric({ precision: 18, scale: 4 }).notNull().default('1'),

    // Immutable Financial History
    unitPrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    subtotal: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    index('sales_order_items_order_idx').on(t.orderId),
    index('sales_order_items_product_idx').on(t.productId),
    index('sales_order_items_variant_idx').on(t.variantId),
    index('sales_order_items_batch_idx').on(t.batchId),
  ]
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

    ...metadata,
  },
  (t) => [index('sales_voids_order_idx').on(t.orderId), index('sales_voids_item_idx').on(t.itemId)]
)

// ─── Sales External Refs ──────────────────────────────────────────────────────

export const salesExternalRefsTable = pgTable(
  'sales_external_refs',
  {
    ...pk,
    orderId: integer()
      .notNull()
      .references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
    externalSource: text().notNull(), // 'Grab', 'Shopee', 'Moka', etc.
    externalOrderId: text().notNull(),
    rawPayload: jsonb(),
    ...metadata,
  },
  (t) => [
    uniqueIndex('sales_external_refs_source_ext_id_idx').on(t.externalSource, t.externalOrderId),
    index('sales_external_refs_order_idx').on(t.orderId),
  ]
)

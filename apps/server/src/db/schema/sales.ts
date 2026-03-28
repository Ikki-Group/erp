import { index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

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
    locationId: uuid()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    // CRM Integration future-proofing
    customerId: uuid(),
    salesTypeId: uuid()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    status: salesOrderStatusEnum().notNull().default('open'),

    transactionDate: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),

    // Financial numbers
    totalAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    index('sales_orders_location_idx').on(t.locationId),
    index('sales_orders_status_idx').on(t.status),
    index('sales_orders_transaction_date_idx').on(t.transactionDate),
  ],
)

// ─── Sales Order Batches ──────────────────────────────────────────────────────

export const salesOrderBatchesTable = pgTable(
  'sales_order_batches',
  {
    ...pk,
    orderId: uuid()
      .notNull()
      .references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
    batchNumber: numeric({ precision: 5, scale: 0 }).notNull(),
    status: text().notNull().default('pending'), // E.g., pending, prepared, delivered
    ...metadata,
  },
  (t) => [index('sales_order_batches_order_idx').on(t.orderId)],
)

// ─── Sales Order Items ────────────────────────────────────────────────────────

export const salesOrderItemsTable = pgTable(
  'sales_order_items',
  {
    ...pk,
    orderId: uuid()
      .notNull()
      .references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
    batchId: uuid().references(() => salesOrderBatchesTable.id, { onDelete: 'set null' }),

    // Custom Items: products/variants optional
    productId: uuid().references(() => productsTable.id, { onDelete: 'set null' }),
    variantId: uuid().references(() => productVariantsTable.id, { onDelete: 'set null' }),

    // Immutable History: Item name must always be stored
    itemName: text().notNull(),

    // Qty keeps scale 4 for fractional cases
    quantity: numeric({ precision: 18, scale: 4 }).notNull().default('1'),

    // Immutable Financial History (scale 2)
    unitPrice: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    discountAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    taxAmount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
    subtotal: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    index('sales_order_items_order_idx').on(t.orderId),
    index('sales_order_items_product_idx').on(t.productId),
    index('sales_order_items_variant_idx').on(t.variantId),
    index('sales_order_items_batch_idx').on(t.batchId),
  ],
)

// ─── Sales Voids ──────────────────────────────────────────────────────────────

export const salesVoidsTable = pgTable(
  'sales_voids',
  {
    ...pk,
    orderId: uuid()
      .notNull()
      .references(() => salesOrdersTable.id, { onDelete: 'cascade' }),
    // If itemId is null, it means the whole order is voided
    itemId: uuid().references(() => salesOrderItemsTable.id, { onDelete: 'cascade' }),
    reason: text(),
    voidedBy: uuid().notNull(), // Soft-link to IAM user UUID

    ...metadata,
  },
  (t) => [index('sales_voids_order_idx').on(t.orderId), index('sales_voids_item_idx').on(t.itemId)],
)

// ─── Sales External Refs ──────────────────────────────────────────────────────

export const salesExternalRefsTable = pgTable(
  'sales_external_refs',
  {
    ...pk,
    orderId: uuid()
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
  ],
)

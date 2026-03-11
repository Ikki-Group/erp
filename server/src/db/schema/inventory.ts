import { date, index, integer, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { metadata, pk, transactionTypeEnum } from './_helpers'
import { locationsTable } from './location'
import { materialsTable } from './material'

// ─── Stock Transactions ───────────────────────────────────────────────────────

export const stockTransactionsTable = pgTable(
  'stock_transactions',
  {
    ...pk,
    materialId: integer()
      .notNull()
      .references(() => materialsTable.id, { onDelete: 'restrict' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),

    type: transactionTypeEnum().notNull(),
    date: date({ mode: 'date' }).notNull(),
    referenceNo: text().notNull(),
    notes: text(),

    // Quantity & Cost — using numeric for financial precision
    qty: numeric({ precision: 18, scale: 4 }).notNull(),
    unitCost: numeric({ precision: 18, scale: 4 }).notNull(),
    totalCost: numeric({ precision: 18, scale: 4 }).notNull(),

    // Transfer-specific
    counterpartLocationId: integer().references(() => locationsTable.id, { onDelete: 'restrict' }),
    transferId: uuid(),

    // Running snapshot after this transaction
    runningQty: numeric({ precision: 18, scale: 4 }).notNull(),
    runningAvgCost: numeric({ precision: 18, scale: 4 }).notNull(),

    ...metadata,
  },
  (t) => [
    index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date),
    index('stock_txn_location_date_idx').on(t.locationId, t.date),
    index('stock_txn_type_date_idx').on(t.type, t.date),
    index('stock_txn_transfer_idx').on(t.transferId),
    index('stock_txn_reference_no_idx').on(t.referenceNo),
  ]
)

// ─── Stock Summaries (Daily Snapshot) ─────────────────────────────────────────

export const stockSummariesTable = pgTable(
  'stock_summaries',
  {
    ...pk,
    materialId: integer()
      .notNull()
      .references(() => materialsTable.id, { onDelete: 'restrict' }),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    date: date({ mode: 'date' }).notNull(),

    // Opening balance
    openingQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    openingAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    openingValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    // Movements
    purchaseQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    purchaseValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    transferInQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    transferInValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    transferOutQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    transferOutValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    adjustmentQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    adjustmentValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    sellQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    sellValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    // Closing balance
    closingQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    closingAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    closingValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    uniqueIndex('stock_summaries_material_location_date_idx').on(t.materialId, t.locationId, t.date),
    index('stock_summaries_location_date_idx').on(t.locationId, t.date),
    index('stock_summaries_date_idx').on(t.date),
  ]
)

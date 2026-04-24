import { sql } from 'drizzle-orm'
import {
	date,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { stockAdjustmentTypeEnum, transactionTypeEnum } from './_helpers'
import { locationsTable } from './location'
import { materialsTable } from './material'

// ─── Stock Batches ────────────────────────────────────────────────────────────

/**
 * Stock Batches Table
 *
 * Support for Batch/Lot tracking and Expiry dates.
 */
export const stockBatchesTable = pgTable(
	'stock_batches',
	{
		...pk,
		materialId: integer()
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		batchNo: text('batch_no').notNull(),
		expiryDate: timestamp('expiry_date', { mode: 'date' }),
		productionDate: timestamp('production_date', { mode: 'date' }),
		notes: text(),
		...auditColumns,
	},
	(t) => [
		index('stock_batches_material_idx').on(t.materialId),
		index('stock_batches_expiry_idx').on(t.expiryDate),
		uniqueIndex('stock_batches_material_no_idx').on(t.materialId, t.batchNo),
	],
)

// ─── Stock Adjustments ────────────────────────────────────────────────────────

/**
 * Stock Adjustments Table (Header)
 *
 * Formal tracking of Stock Opname, Waste, Found items, or Corrections.
 */
export const stockAdjustmentsTable = pgTable(
	'stock_adjustments',
	{
		...pk,
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		type: stockAdjustmentTypeEnum().notNull(),
		adjustmentDate: timestamp('adjustment_date', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),
		reason: text(),
		referenceNo: text('reference_no'),
		...auditColumns,
	},
	(t) => [
		index('stock_adjustments_location_idx').on(t.locationId),
		index('stock_adjustments_date_idx').on(t.adjustmentDate),
	],
)

export const stockAdjustmentItemsTable = pgTable(
	'stock_adjustment_items',
	{
		...pk,
		adjustmentId: integer()
			.notNull()
			.references(() => stockAdjustmentsTable.id, { onDelete: 'cascade' }),
		materialId: integer()
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),
		batchId: integer().references(() => stockBatchesTable.id, { onDelete: 'set null' }),

		/** Difference in quantity: positive for found, negative for waste/correction */
		qtyDiff: numeric({ precision: 18, scale: 4 }).notNull(),
		/** Snapshot of unit cost at adjustment time */
		unitCost: numeric({ precision: 18, scale: 2 }).notNull(),

		notes: text(),
		...auditColumns,
	},
	(t) => [
		index('stock_adj_items_header_idx').on(t.adjustmentId),
		index('stock_adj_items_material_idx').on(t.materialId),
	],
)

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

		// Batch Support
		batchId: integer().references(() => stockBatchesTable.id, { onDelete: 'set null' }),

		// Quantity & Cost — using numeric
		// qty keeps scale 4 (e.g., 0.0125 kg)
		qty: numeric({ precision: 18, scale: 4 }).notNull(),
		// unitCost & totalCost use scale 2 for IDR/Rupiah or standard fiat
		unitCost: numeric({ precision: 18, scale: 2 }).notNull(),
		totalCost: numeric({ precision: 18, scale: 2 }).notNull(),

		// Transfer-specific
		counterpartLocationId: integer().references(() => locationsTable.id, { onDelete: 'restrict' }),
		transferId: integer(),

		// Adjustment Link
		adjustmentItemId: integer().references(() => stockAdjustmentItemsTable.id, {
			onDelete: 'set null',
		}),

		// Running snapshot after this transaction
		runningQty: numeric({ precision: 18, scale: 4 }).notNull(),
		runningAvgCost: numeric({ precision: 18, scale: 2 }).notNull(),

		...auditColumns,
	},
	(t) => [
		index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date),
		index('stock_txn_location_date_idx').on(t.locationId, t.date),
		index('stock_txn_type_date_idx').on(t.type, t.date),
		index('stock_txn_transfer_idx').on(t.transferId),
		index('stock_txn_reference_no_idx').on(t.referenceNo),
		index('stock_txn_batch_idx').on(t.batchId),
	],
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
		openingAvgCost: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		openingValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		// Movements
		purchaseQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		purchaseValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		transferInQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		transferInValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		transferOutQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		transferOutValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		adjustmentQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		adjustmentValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		usageQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		usageValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		productionInQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		productionInValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		productionOutQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		productionOutValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		sellQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		sellValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		// Closing balance
		closingQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		closingAvgCost: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		closingValue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		...auditColumns,
	},
	(t) => [
		uniqueIndex('stock_summaries_material_location_date_idx')
			.on(t.materialId, t.locationId, t.date)
			.where(sql`${t.deletedAt} IS NULL`),
		index('stock_summaries_location_date_idx').on(t.locationId, t.date),
		index('stock_summaries_date_idx').on(t.date),
	],
)

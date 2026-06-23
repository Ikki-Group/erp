import { isNull, sql } from 'drizzle-orm'
import {
	check,
	date,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditFullColumns, pk } from './_helpers'
import { locationsTable } from './location'
import { materialsTable } from './material'

export const transactionTypeEnum = pgEnum('transaction_type', [
	'purchase',
	'transfer_in',
	'transfer_out',
	'adjustment',
	'sell',
	'usage',
	'production_in',
	'production_out',
])
export const stockAdjustmentTypeEnum = pgEnum('stock_adjustment_type', ['opname', 'found', 'waste', 'correction'])

// ─── Stock Batches ────────────────────────────────────────────────────────────

/**
 * Stock Batches Table
 * Support for Batch/Lot tracking and Expiry dates.
 */
export const stockBatchesTable = pgTable(
	'stock_batches',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		batchNo: text('batch_no').notNull(),
		expiryDate: timestamp('expiry_date', { mode: 'date' }),
		productionDate: timestamp('production_date', { mode: 'date' }),
		notes: text('notes'),
		...auditFullColumns,
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
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		type: stockAdjustmentTypeEnum('type').notNull(),
		adjustmentDate: timestamp('adjustment_date', { mode: 'date', withTimezone: true })
			.notNull()
			.defaultNow(),
		reason: text('reason'),
		referenceNo: text('reference_no'),
		...auditFullColumns,
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
		adjustmentId: integer('adjustment_id')
			.notNull()
			.references(() => stockAdjustmentsTable.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),
		batchId: integer('batch_id').references(() => stockBatchesTable.id, { onDelete: 'set null' }),

		/** Difference in quantity: positive for found, negative for waste/correction */
		qtyDiff: numeric('qty_diff', { precision: 18, scale: 6 }).notNull(),
		/** Snapshot of unit cost at adjustment time */
		unitCost: numeric('unit_cost', { precision: 18, scale: 2 }).notNull(),

		notes: text('notes'),
		...auditFullColumns,
	},
	(t) => [
		index('stock_adj_items_header_idx').on(t.adjustmentId),
		index('stock_adj_items_material_idx').on(t.materialId),

		// Unit cost must be non-negative
		check('stock_adj_items_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
	],
)

// ─── Stock Transactions ───────────────────────────────────────────────────────

export const stockTransactionsTable = pgTable(
	'stock_transactions',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		type: transactionTypeEnum('type').notNull(),
		date: date('date', { mode: 'date' }).notNull(),
		referenceNo: text('reference_no').notNull(),
		notes: text('notes'),

		// Batch Support
		batchId: integer('batch_id').references(() => stockBatchesTable.id, { onDelete: 'set null' }),

		// Quantity & Cost — using numeric
		// qty keeps scale 6 (matches material.ts precision)
		qty: numeric('qty', { precision: 18, scale: 6 }).notNull(),
		// unitCost & totalCost use scale 2 for IDR/Rupiah or standard fiat
		unitCost: numeric('unit_cost', { precision: 18, scale: 2 }).notNull(),
		totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),

		// Transfer-specific
		counterpartLocationId: integer('counterpart_location_id').references(() => locationsTable.id, {
			onDelete: 'restrict',
		}),
		transferId: integer('transfer_id'),

		// Running snapshot after this transaction
		runningQty: numeric('running_qty', { precision: 18, scale: 6 }).notNull(),
		runningAvgCost: numeric('running_avg_cost', { precision: 18, scale: 2 }).notNull(),

		...auditFullColumns,
	},
	(t) => [
		index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date),
		index('stock_txn_location_date_idx').on(t.locationId, t.date),
		index('stock_txn_type_date_idx').on(t.type, t.date),
		index('stock_txn_transfer_idx').on(t.transferId),
		index('stock_txn_reference_no_idx').on(t.referenceNo),
		index('stock_txn_batch_idx').on(t.batchId),

		// Cost fields must be non-negative
		check('stock_txn_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
		check('stock_txn_total_cost_nonneg_chk', sql`total_cost >= 0`),
	],
)

// ─── Stock Summaries (Daily Snapshot) ─────────────────────────────────────────

export const stockSummariesTable = pgTable(
	'stock_summaries',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		date: date('date', { mode: 'date' }).notNull(),

		// Opening balance
		openingQty: numeric('opening_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		openingAvgCost: numeric('opening_avg_cost', { precision: 18, scale: 2 }).notNull().default('0'),
		openingValue: numeric('opening_value', { precision: 18, scale: 2 }).notNull().default('0'),

		// Movements
		purchaseQty: numeric('purchase_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		purchaseValue: numeric('purchase_value', { precision: 18, scale: 2 }).notNull().default('0'),
		transferInQty: numeric('transfer_in_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		transferInValue: numeric('transfer_in_value', { precision: 18, scale: 2 }).notNull().default('0'),
		transferOutQty: numeric('transfer_out_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		transferOutValue: numeric('transfer_out_value', { precision: 18, scale: 2 }).notNull().default('0'),
		adjustmentQty: numeric('adjustment_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		adjustmentValue: numeric('adjustment_value', { precision: 18, scale: 2 }).notNull().default('0'),
		usageQty: numeric('usage_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		usageValue: numeric('usage_value', { precision: 18, scale: 2 }).notNull().default('0'),
		productionInQty: numeric('production_in_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		productionInValue: numeric('production_in_value', { precision: 18, scale: 2 })
			.notNull()
			.default('0'),
		productionOutQty: numeric('production_out_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		productionOutValue: numeric('production_out_value', { precision: 18, scale: 2 })
			.notNull()
			.default('0'),
		sellQty: numeric('sell_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		sellValue: numeric('sell_value', { precision: 18, scale: 2 }).notNull().default('0'),

		// Closing balance
		closingQty: numeric('closing_qty', { precision: 18, scale: 6 }).notNull().default('0'),
		closingAvgCost: numeric('closing_avg_cost', { precision: 18, scale: 2 }).notNull().default('0'),
		closingValue: numeric('closing_value', { precision: 18, scale: 2 }).notNull().default('0'),

		...auditFullColumns,
	},
	(t) => [
		uniqueIndex('stock_summaries_material_location_date_idx')
			.on(t.materialId, t.locationId, t.date)
			.where(isNull(t.deletedAt)),
		index('stock_summaries_location_date_idx').on(t.locationId, t.date),
		index('stock_summaries_date_idx').on(t.date),
	],
)

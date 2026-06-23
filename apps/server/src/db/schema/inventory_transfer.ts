import { check, index, integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { auditFullColumns, pk } from './_helpers'
import { locationsTable } from './location'
import { materialsTable } from './material'

/**
 * Stock Transfer Approval Status Enum
 */
export const transferStatusEnum = [
	'pending_approval',
	'approved',
	'rejected',
	'in_transit',
	'completed',
	'cancelled',
] as const

/**
 * Stock Transfers Table
 *
 * Tracks stock transfer requests between locations with approval workflow.
 */
export const stockTransfersTable = pgTable(
	'stock_transfers',
	{
		...pk,
		sourceLocationId: integer('source_location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		destinationLocationId: integer('destination_location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		status: text('status', { enum: transferStatusEnum }).notNull().default('pending_approval'),

		transferDate: timestamp('transfer_date', { mode: 'date', withTimezone: true }).notNull(),
		expectedDate: timestamp('expected_date', { mode: 'date', withTimezone: true }),
		receivedDate: timestamp('received_date', { mode: 'date', withTimezone: true }),

		// Reference number for tracking
		referenceNo: text('reference_no').notNull(),
		notes: text('notes'),
		rejectionReason: text('rejection_reason'),

		...auditFullColumns,
	},
	(t) => [
		index('stock_transfers_source_idx').on(t.sourceLocationId),
		index('stock_transfers_destination_idx').on(t.destinationLocationId),
		index('stock_transfers_status_idx').on(t.status),
		index('stock_transfers_date_idx').on(t.transferDate),

		// Source and destination cannot be the same
		check('stock_transfers_different_locations_chk', sql`source_location_id <> destination_location_id`),
	],
)

/**
 * Stock Transfer Items Table
 *
 * Individual materials being transferred.
 */
export const stockTransferItemsTable = pgTable(
	'stock_transfer_items',
	{
		...pk,
		transferId: integer('transfer_id')
			.notNull()
			.references(() => stockTransfersTable.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),

		itemName: text('item_name').notNull(),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		unitCost: numeric('unit_cost', { precision: 18, scale: 2 }).notNull(),
		totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),

		notes: text('notes'),
		...auditFullColumns,
	},
	(t) => [
		index('stock_transfer_items_transfer_idx').on(t.transferId),
		index('stock_transfer_items_material_idx').on(t.materialId),

		// Quantity must be positive
		check('stock_transfer_items_qty_pos_chk', sql`quantity > 0`),
		// Cost fields must be non-negative
		check('stock_transfer_items_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
		check('stock_transfer_items_total_cost_nonneg_chk', sql`total_cost >= 0`),
	],
)

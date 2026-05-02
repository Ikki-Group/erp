import { index, integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { locationsTable } from './location'
import { materialsTable } from './material'

/**
 * Stock Transfer Approval Status Enum
 */
export const transferStatusEnum = ['pending_approval', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'] as const

/**
 * Stock Transfers Table
 *
 * Tracks stock transfer requests between locations with approval workflow.
 */
export const stockTransfersTable = pgTable('stock_transfers', {
	...pk,
	sourceLocationId: integer()
		.notNull()
		.references(() => locationsTable.id, { onDelete: 'restrict' }),
	destinationLocationId: integer()
		.notNull()
		.references(() => locationsTable.id, { onDelete: 'restrict' }),
	status: text('status', { enum: transferStatusEnum }).notNull().default('pending_approval'),

	transferDate: timestamp('transfer_date', { mode: 'date' }).notNull(),
	expectedDate: timestamp('expected_date', { mode: 'date' }),
	receivedDate: timestamp('received_date', { mode: 'date' }),

	// Reference number for tracking
	referenceNo: text('reference_no').notNull(),
	notes: text(),
	rejectionReason: text('rejection_reason'),

	...auditColumns,
}, (t) => [
	index('stock_transfers_source_idx').on(t.sourceLocationId),
	index('stock_transfers_destination_idx').on(t.destinationLocationId),
	index('stock_transfers_status_idx').on(t.status),
	index('stock_transfers_date_idx').on(t.transferDate),
])

/**
 * Stock Transfer Items Table
 *
 * Individual materials being transferred.
 */
export const stockTransferItemsTable = pgTable('stock_transfer_items', {
	...pk,
	transferId: integer()
		.notNull()
		.references(() => stockTransfersTable.id, { onDelete: 'cascade' }),
	materialId: integer()
		.notNull()
		.references(() => materialsTable.id, { onDelete: 'restrict' }),

	itemName: text().notNull(),
	quantity: numeric({ precision: 18, scale: 4 }).notNull(),
	unitCost: numeric({ precision: 18, scale: 2 }).notNull(),
	totalCost: numeric({ precision: 18, scale: 2 }).notNull(),

	notes: text(),
	...auditColumns,
}, (t) => [
	index('stock_transfer_items_transfer_idx').on(t.transferId),
	index('stock_transfer_items_material_idx').on(t.materialId),
])

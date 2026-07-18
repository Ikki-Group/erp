import { index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'

/**
 * Document Sequences Table
 *
 * Auto-generates human-readable reference numbers for transactional documents.
 * Each row tracks the last used sequence number for a (location, type, year, month)
 * combination. The service layer atomically increments `lastSequence` to generate
 * the next number.
 *
 * Generated format: `{prefix}-{YYMM}-{seq padded}`
 * Example: `SO-JKT001-2607-0001`, `PO-WH01-2607-0042`
 *
 * `documentType` — discriminator for the document kind.
 *   Supported: 'SO' (Sales Order), 'PO' (Purchase Order), 'GRN' (Goods Receipt),
 *   'SI' (Sales Invoice), 'PI' (Purchase Invoice), 'TRF' (Stock Transfer),
 *   'ADJ' (Stock Adjustment), 'WO' (Work Order), 'EXP' (Expenditure).
 *
 * `prefix` — location-derived short code included in the generated number.
 *   Typically matches `locations.code` (e.g., 'JKT001', 'WH01').
 *
 * `year` / `month` — the period this sequence counter belongs to.
 *   Resets to 0 at the start of each new month.
 *
 * `lastSequence` — the last issued number. Next number = lastSequence + 1.
 *   Incremented atomically via `UPDATE ... SET last_sequence = last_sequence + 1 RETURNING`.
 *
 * Concurrency: The atomic UPDATE+RETURNING pattern ensures no duplicates
 * under concurrent requests without requiring advisory locks.
 */
export const documentSequencesTable = pgTable(
	'document_sequences',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		documentType: text('document_type').notNull(),
		prefix: text('prefix').notNull(),
		year: integer('year').notNull(),
		month: integer('month').notNull(),
		lastSequence: integer('last_sequence').notNull().default(0),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('document_sequences_loc_type_period_idx').on(
			t.locationId,
			t.documentType,
			t.year,
			t.month,
		),
		index('document_sequences_type_idx').on(t.documentType),
	],
)

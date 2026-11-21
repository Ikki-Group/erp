import { pgTable, varchar, integer, uniqueIndex } from 'drizzle-orm/pg-core'

import { pk } from './_helpers.ts'
import { locations } from './core.ts'

// ─── Document Sequences ───

export const documentSequences = pgTable(
	'document_sequences',
	{
		...pk,
		prefix: varchar('prefix', { length: 10 }).notNull(),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		date: varchar('date', { length: 8 }).notNull(),
		lastSeq: integer('last_seq').notNull().default(0),
	},
	(t) => [
		uniqueIndex('document_sequences_prefix_location_date_uniq').on(t.prefix, t.locationId, t.date),
	],
)

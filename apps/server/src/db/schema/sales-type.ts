import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { unique } from 'drizzle-orm/pg-core'
import { index } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from '@/core/database/schema'

import { locationsTable } from './location'

export const salesTypesTable = pgTable(
	'sales_types',
	{
		...pk,
		locationId: integer().references(() => locationsTable.id, { onDelete: 'cascade' }),
		code: text().notNull().unique(),
		name: text().notNull(),
		isSystem: boolean().notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [
		unique('sales_types_location_id_code_idx').on(t.locationId, t.code),
		index('sales_types_code_idx').on(t.code),
		index('sales_types_location_id_idx').on(t.locationId),
	],
)

import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from '@/core/database/schema'

export const uomsTable = pgTable(
	'uoms',
	{ ...pk, code: text().notNull(), ...auditBasicColumns },
	(t) => [uniqueIndex('uoms_code_idx').on(t.code)],
)

import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'

export const uomsTable = pgTable(
	'uoms',
	{ ...pk, code: text().notNull(), ...auditBasicColumns },
	(t) => [uniqueIndex('uoms_code_idx').on(t.code)],
)

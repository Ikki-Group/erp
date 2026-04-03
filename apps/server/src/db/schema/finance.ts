import { isNull } from 'drizzle-orm'
import { boolean, integer, pgEnum, pgTable, text, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])

export const accountsTable = pgTable(
  'accounts',
  {
    ...pk,
    code: text('code').notNull(),
    name: text('name').notNull(),
    type: accountTypeEnum('type').notNull(),
    isGroup: boolean('is_group').default(false).notNull(),
    parentId: integer('parent_id').references((): AnyPgColumn => accountsTable.id, { onDelete: 'restrict' }),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('accounts_code_idx').on(t.code).where(isNull(t.deletedAt)),
  ],
)

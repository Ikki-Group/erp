import { boolean, integer, numeric, pgTable, primaryKey, serial, varchar } from 'drizzle-orm/pg-core'

import { metafields } from '@/database/schema/common'

export const materialCategoryTable = pgTable('masterialCategories', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  ...metafields,
})

export const uomTable = pgTable('uoms', {
  code: varchar({ length: 255 }).notNull().primaryKey(),
  ...metafields,
})

export const materialTable = pgTable('masterials', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 255 }),
  sku: varchar({ length: 255 }).notNull().unique(),
  categoryId: integer()
    .notNull()
    .references(() => materialCategoryTable.id),
  baseUomId: integer()
    .notNull()
    .references(() => uomTable.code),
  isActive: boolean().default(true).notNull(),
  ...metafields,
})

export const materialUomConversionTable = pgTable(
  'materialUomConversions',
  {
    materialId: integer()
      .notNull()
      .references(() => materialTable.id),
    fromUomCode: integer()
      .notNull()
      .references(() => uomTable.code),
    toUomCode: integer()
      .notNull()
      .references(() => uomTable.code),
    multiplier: numeric().notNull(),
  },
  (t) => [primaryKey({ columns: [t.materialId, t.fromUomCode, t.toUomCode] })]
)

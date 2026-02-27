import { boolean, integer, numeric, pgTable, primaryKey, serial, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'

export const materialCategoryTable = pgTable('materialCategories', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  ...metafields,
})

export const uomTable = pgTable('uoms', {
  code: varchar({ length: 255 }).notNull().primaryKey(),
  ...metafields,
})

export const materialTable = pgTable('materials', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 255 }),
  sku: varchar({ length: 255 }).notNull().unique(),
  categoryId: integer()
    .notNull()
    .references(() => materialCategoryTable.id),
  baseUomCode: varchar({ length: 255 })
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
    fromUomCode: varchar({ length: 255 })
      .notNull()
      .references(() => uomTable.code),
    toUomCode: varchar({ length: 255 })
      .notNull()
      .references(() => uomTable.code),
    multiplier: numeric().notNull(),
  },
  (t) => [primaryKey({ columns: [t.materialId, t.fromUomCode, t.toUomCode] })]
)

import { boolean, integer, numeric, pgTable, primaryKey, serial, varchar } from 'drizzle-orm/pg-core'

import { metafields } from './common'

export const materialCategoryTable = pgTable('materialCategories', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  ...metafields,
})

export const uomTable = pgTable('uoms', {
  id: serial().primaryKey(),
  code: varchar({ length: 255 }).notNull(),
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
  baseUomId: integer()
    .notNull()
    .references(() => uomTable.id),
  isActive: boolean().default(true).notNull(),
  ...metafields,
})

export const materialUomConversionTable = pgTable(
  'materialUomConversions',
  {
    materialId: integer()
      .notNull()
      .references(() => materialTable.id),
    fromUomId: integer()
      .notNull()
      .references(() => uomTable.id),
    toUomId: integer()
      .notNull()
      .references(() => uomTable.id),
    multiplier: numeric().notNull(),
  },
  (t) => [primaryKey({ columns: [t.materialId, t.fromUomId, t.toUomId] })]
)

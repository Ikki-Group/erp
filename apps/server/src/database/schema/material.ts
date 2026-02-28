import { boolean, integer, numeric, pgTable, primaryKey, serial, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

import { lower, metafields } from './common'

export const materialCategoryTable = pgTable(
  'materialCategories',
  {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    ...metafields,
  },
  (t) => [uniqueIndex('material_category_name').on(lower(t.name))]
)

export const uomTable = pgTable(
  'uoms',
  {
    id: serial().primaryKey(),
    code: varchar({ length: 255 }).notNull(),
    ...metafields,
  },
  (t) => [uniqueIndex('uom_code').on(lower(t.code))]
)

export const materialTable = pgTable(
  'materials',
  {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    sku: varchar({ length: 255 }).notNull(),
    categoryId: integer().references(() => materialCategoryTable.id),
    baseUomId: integer()
      .notNull()
      .references(() => uomTable.id, { onDelete: 'restrict' }),
    isActive: boolean().default(true).notNull(),
    ...metafields,
  },
  (t) => [uniqueIndex('material_name').on(lower(t.name)), uniqueIndex('material_sku').on(lower(t.sku))]
)

export const materialUomTable = pgTable(
  'materialUoms',
  {
    materialId: integer()
      .notNull()
      .references(() => materialTable.id, { onDelete: 'cascade' }),
    uomId: integer()
      .notNull()
      .references(() => uomTable.id, { onDelete: 'restrict' }),
    conversionFactor: numeric({
      precision: 18,
      scale: 6,
    }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.materialId, t.uomId] })]
)

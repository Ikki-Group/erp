import { boolean, integer, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core'

import { metafields } from './common'
import { itemType } from './enum'
import { locations } from './locations'
import { uoms } from './master'

export const itemCategories = pgTable('itemCategories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text(),
  ...metafields,
})

export const items = pgTable('items', {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text(),
  type: itemType().notNull(),
  baseUnit: text()
    .notNull()
    .references(() => uoms.code),
  categoryId: integer()
    .notNull()
    .references(() => itemCategories.id),
  ...metafields,
})

export const itemUnitConversions = pgTable('itemUnitConversions', {
  id: serial().primaryKey(),
  itemId: integer()
    .notNull()
    .references(() => items.id),
  fromUnit: text()
    .notNull()
    .references(() => uoms.code),
  toUnit: text()
    .notNull()
    .references(() => uoms.code),
  multiplier: numeric().notNull(),
})

export const itemLocations = pgTable('itemLocations', {
  id: serial().primaryKey(),
  itemId: integer()
    .notNull()
    .references(() => items.id),
  locationId: integer()
    .notNull()
    .references(() => locations.id),
  isAssigned: boolean().notNull().default(false),
  stockAlertLevel: integer().notNull().default(0),
  allowNegativeStock: boolean().notNull().default(false),
  ...metafields,
})

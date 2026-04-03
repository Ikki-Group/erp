import { isNull, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { productStatusEnum } from './_helpers'
import { locationsTable } from './location'

// ─── Sales Types ──────────────────────────────────────────────────────────────

export const salesTypesTable = pgTable(
  'sales_types',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    isSystem: boolean().notNull().default(false),
    ...auditColumns,
  },
  (t) => [uniqueIndex('sales_types_code_idx').on(t.code)],
)

// ─── Product Categories ───────────────────────────────────────────────────────

export const productCategoriesTable = pgTable(
  'product_categories',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    parentId: integer().references((): AnyPgColumn => productCategoriesTable.id, { onDelete: 'set null' }),
    ...auditColumns,
  },
  (t) => [uniqueIndex('product_categories_name_idx').on(t.name).where(isNull(t.deletedAt))],
)

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsTable = pgTable(
  'products',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    categoryId: integer().references(() => productCategoriesTable.id, { onDelete: 'set null' }),
    status: productStatusEnum().notNull().default('active'),

    // ── Feature Flags ──────────────────────────────────────────────────
    hasVariants: boolean().notNull().default(false),
    hasSalesTypePricing: boolean().notNull().default(false),

    // ── Pricing ────────────────────────────────────────────────────────
    basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...auditColumns,
  },
  (t) => [
    uniqueIndex('products_sku_location_idx').on(t.sku, t.locationId).where(isNull(t.deletedAt)),
    uniqueIndex('products_name_location_idx').on(t.name, t.locationId).where(isNull(t.deletedAt)),
    index('products_location_idx').on(t.locationId),
    index('products_category_idx').on(t.categoryId),
    index('products_status_idx').on(t.status),
  ],
)

// ─── Product Prices ───────────────────────────────────────────────────────────

export const productPricesTable = pgTable(
  'product_prices',
  {
    ...pk,
    productId: integer()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    salesTypeId: integer()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    price: numeric({ precision: 18, scale: 4 }).notNull(),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('product_prices_product_sales_type_idx').on(t.productId, t.salesTypeId),
    index('product_prices_sales_type_idx').on(t.salesTypeId),
  ],
)

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariantsTable = pgTable(
  'product_variants',
  {
    ...pk,
    productId: integer()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    sku: text(),
    isDefault: boolean().notNull().default(false),
    basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
    uniqueIndex('product_variants_sku_idx')
      .on(t.productId, t.sku)
      .where(sql`${t.sku} IS NOT NULL`),
  ],
)

// ─── Variant Prices ───────────────────────────────────────────────────────────

export const variantPricesTable = pgTable(
  'variant_prices',
  {
    ...pk,
    variantId: integer()
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    salesTypeId: integer()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    price: numeric({ precision: 18, scale: 4 }).notNull(),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('variant_prices_variant_sales_type_idx').on(t.variantId, t.salesTypeId),
    index('variant_prices_sales_type_idx').on(t.salesTypeId),
  ],
)

// ─── Product External Mappings ────────────────────────────────────────────────

export const productExternalMappingsTable = pgTable(
  'product_external_mappings',
  {
    ...pk,
    productId: integer()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    variantId: integer().references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    provider: text().notNull(),
    externalId: text().notNull(),
    externalData: jsonb(),
    lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('product_ext_map_provider_ext_id_idx').on(t.provider, t.externalId),
    uniqueIndex('product_ext_map_provider_product_variant_idx').on(t.provider, t.productId, t.variantId),
    index('product_ext_map_product_idx').on(t.productId),
    index('product_ext_map_provider_idx').on(t.provider),
  ],
)

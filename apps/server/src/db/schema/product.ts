import { isNull, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

import { metadata, pk, productStatusEnum } from './_helpers'
import { locationsTable } from './location'

// ─── Sales Types ──────────────────────────────────────────────────────────────
// Global lookup for sales channels (dine-in, takeaway, delivery, etc.).
// Not per-outlet — every outlet shares the same set of sales types.

export const salesTypesTable = pgTable(
  'sales_types',
  { ...pk, code: text().notNull(), name: text().notNull(), isSystem: boolean().notNull().default(false), ...metadata },
  (t) => [uniqueIndex('sales_types_code_idx').on(t.code)],
)

// ─── Product Categories ───────────────────────────────────────────────────────

export const productCategoriesTable = pgTable(
  'product_categories',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    parentId: uuid().references((): AnyPgColumn => productCategoriesTable.id, { onDelete: 'set null' }),
    ...metadata,
  },
  (t) => [uniqueIndex('product_categories_name_idx').on(t.name).where(isNull(t.deletedAt))],
)

// ─── Products ─────────────────────────────────────────────────────────────────
// Core product entity. A product belongs to exactly one outlet (location).
//
// Pricing resolution (determined by hasVariants × hasSalesTypePricing):
//
//  hasVariants │ hasSalesTypePricing │ Price source
//  ──────────────┼──────────────────────┼──────────────────────────────────────
//  false       │ false                │ products.basePrice
//  false       │ true                 │ product_prices → products.basePrice
//  true        │ false                │ product_variants.basePrice
//  true        │ true                 │ variant_prices → variants.basePrice → products.basePrice

export const productsTable = pgTable(
  'products',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    locationId: uuid()
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),
    categoryId: uuid().references(() => productCategoriesTable.id, { onDelete: 'set null' }),
    status: productStatusEnum().notNull().default('active'),

    // ── Feature Flags ──────────────────────────────────────────────────
    // Whether this product uses variants (sizes, flavors, etc.)
    hasVariants: boolean().notNull().default(false),
    // Whether per-sales-type pricing is enabled
    hasSalesTypePricing: boolean().notNull().default(false),

    // ── Pricing ────────────────────────────────────────────────────────
    // Ultimate fallback price, always present.
    basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

    ...metadata,
  },
  (t) => [
    // SKU uniqueness scoped per location
    uniqueIndex('products_sku_location_idx')
      .on(t.sku, t.locationId)
      .where(isNull(t.deletedAt)),
    // Name uniqueness scoped per location
    uniqueIndex('products_name_location_idx')
      .on(t.name, t.locationId)
      .where(isNull(t.deletedAt)),
    // Standalone indexes for reverse lookups
    index('products_location_idx').on(t.locationId),
    index('products_category_idx').on(t.categoryId),
    index('products_status_idx').on(t.status),
  ],
)

// ─── Product Prices ───────────────────────────────────────────────────────────
// Product-level per-sales-type pricing.
// Used when hasVariants = false AND hasSalesTypePricing = true.
// Falls back to products.basePrice if no row exists for a given sales type.

export const productPricesTable = pgTable(
  'product_prices',
  {
    ...pk,
    productId: uuid()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    salesTypeId: uuid()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    price: numeric({ precision: 18, scale: 4 }).notNull(),
    ...metadata,
  },
  (t) => [
    // One price per product per sales type
    uniqueIndex('product_prices_product_sales_type_idx').on(t.productId, t.salesTypeId),
    index('product_prices_sales_type_idx').on(t.salesTypeId),
  ],
)

// ─── Product Variants ─────────────────────────────────────────────────────────
// Only relevant when products.hasVariants = true.
// Each variant can have its own SKU and base price.

export const productVariantsTable = pgTable(
  'product_variants',
  {
    ...pk,
    productId: uuid()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    sku: text(),
    isDefault: boolean().notNull().default(false),
    // Variant's own base price — used when hasSalesTypePricing = false
    basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    ...metadata,
  },
  (t) => [
    // One variant name per product
    uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
    // Variant SKU uniqueness scoped per product (partial — only where sku is not null)
    uniqueIndex('product_variants_sku_idx')
      .on(t.productId, t.sku)
      .where(sql`${t.sku} IS NOT NULL`),
  ],
)

// ─── Variant Prices ───────────────────────────────────────────────────────────
// Variant-level per-sales-type pricing.
// Used when hasVariants = true AND hasSalesTypePricing = true.
// Falls back to variant.basePrice → product.basePrice.

export const variantPricesTable = pgTable(
  'variant_prices',
  {
    ...pk,
    variantId: uuid()
      .notNull()
      .references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    salesTypeId: uuid()
      .notNull()
      .references(() => salesTypesTable.id, { onDelete: 'restrict' }),
    price: numeric({ precision: 18, scale: 4 }).notNull(),
    ...metadata,
  },
  (t) => [
    // One price per variant per sales type
    uniqueIndex('variant_prices_variant_sales_type_idx').on(t.variantId, t.salesTypeId),
    index('variant_prices_sales_type_idx').on(t.salesTypeId),
  ],
)

// ─── Product External Mappings ────────────────────────────────────────────────
// Generic mapping table for external POS/marketplace integrations (Moka, GrabFood, etc.).
// Links an external entity to either a product or a specific variant.
// productId is always set; variantId is set only for variant-level mappings.

export const productExternalMappingsTable = pgTable(
  'product_external_mappings',
  {
    ...pk,
    productId: uuid()
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    variantId: uuid().references(() => productVariantsTable.id, { onDelete: 'cascade' }),
    // Integration provider key (e.g., 'moka', 'grabfood', 'shopeefood')
    provider: text().notNull(),
    // The ID of this item in the external system
    externalId: text().notNull(),
    // Optional raw data snapshot from the external system (for debugging/audit)
    externalData: jsonb(),
    // Last time this mapping was synced
    lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
    ...metadata,
  },
  (t) => [
    // Each external entity maps to exactly one internal entity
    uniqueIndex('product_ext_map_provider_ext_id_idx').on(t.provider, t.externalId),
    // Each internal product/variant has at most one mapping per provider
    uniqueIndex('product_ext_map_provider_product_variant_idx').on(t.provider, t.productId, t.variantId),
    index('product_ext_map_product_idx').on(t.productId),
    index('product_ext_map_provider_idx').on(t.provider),
  ],
)

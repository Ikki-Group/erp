import { boolean, index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { metadata, pk, productStatusEnum } from './_helpers'
import { locations } from './location'

// ─── Sales Types ──────────────────────────────────────────────────────────────
// Global lookup for sales channels (dine-in, takeaway, delivery, etc.).
// Not per-outlet — every outlet shares the same set of sales types.

export const salesTypes = pgTable(
  'sales_types',
  {
    ...pk,
    code: text().notNull(),
    name: text().notNull(),
    ...metadata,
  },
  (t) => [uniqueIndex('sales_types_code_idx').on(t.code)]
)

// ─── Product Categories ───────────────────────────────────────────────────────

export const productCategories = pgTable(
  'product_categories',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    ...metadata,
  },
  (t) => [uniqueIndex('product_categories_name_idx').on(t.name)]
)

// ─── Products ─────────────────────────────────────────────────────────────────
// A product belongs to exactly one outlet (location).
// Must always have at least one variant (enforced at application layer).

export const products = pgTable(
  'products',
  {
    ...pk,
    name: text().notNull(),
    description: text(),
    sku: text().notNull(),
    locationId: integer()
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    categoryId: integer().references(() => productCategories.id, { onDelete: 'set null' }),
    status: productStatusEnum().notNull().default('active'),
    // Fallback price when a sales-type-specific price is missing
    basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
    ...metadata,
  },
  (t) => [
    // SKU uniqueness scoped per location
    uniqueIndex('products_sku_location_idx').on(t.sku, t.locationId),
    // Name uniqueness scoped per location
    uniqueIndex('products_name_location_idx').on(t.name, t.locationId),
    // Standalone indexes for reverse lookups
    index('products_location_idx').on(t.locationId),
    index('products_category_idx').on(t.categoryId),
  ]
)

// ─── Product Variants ─────────────────────────────────────────────────────────
// Every product has ≥1 variant. If product is created without variants,
// the service layer creates a default variant (isDefault = true).
// "At least one variant" is enforced at the application layer.

export const productVariants = pgTable(
  'product_variants',
  {
    ...pk,
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    isDefault: boolean().notNull().default(false),
    ...metadata,
  },
  (t) => [
    // One variant name per product
    uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
  ]
)

// ─── Variant Prices ───────────────────────────────────────────────────────────
// Fully normalized pricing: one row per variant × sales type.
// No JSON fields. Price existence for every salesType is enforced at the
// application layer.

export const variantPrices = pgTable(
  'variant_prices',
  {
    ...pk,
    variantId: integer()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    salesTypeId: integer()
      .notNull()
      .references(() => salesTypes.id, { onDelete: 'restrict' }),
    price: numeric({ precision: 18, scale: 4 }).notNull(),
    ...metadata,
  },
  (t) => [
    // One price per variant per sales type
    uniqueIndex('variant_prices_variant_sales_type_idx').on(t.variantId, t.salesTypeId),
    // Reverse lookup: all prices for a given sales type
    index('variant_prices_sales_type_idx').on(t.salesTypeId),
  ]
)

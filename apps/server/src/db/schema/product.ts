import { eq, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location.ts'
import { salesTypesTable } from './sales-type.ts'
// import { taxesTable } from './tax.ts'

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived'])


/**
 * Product Categories Table
 *
 * Per-location classification for products. A category belongs exclusively
 * to one location — categories are not shared across locations.
 *
 * `code`       — stable, normalized machine identifier (e.g. 'BEVERAGES').
 *                Unique within a location. Used for seeding and API references.
 *
 * `name`       — human-readable label. Unique within a location.
 *
 * Cross-location assignment guard:
 *   A product must only reference a category from the same location.
 *   This is enforced via a Postgres trigger (see migrations/product_category_location_guard.sql)
 *   since Drizzle cannot express a composite FK across (categoryId, locationId)
 *   without polluting the products schema.
 *
 * onDelete: 'restrict' from location — retiring a location must explicitly
 * clear its product categories first. Mirrors productsTable behaviour and
 * prevents silent cascade destruction of category trees.
 */
export const productCategoriesTable = pgTable(
	'product_categories',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_categories_code_location_idx').on(t.code, t.locationId),
		uniqueIndex('product_categories_name_location_idx').on(t.name, t.locationId),
		index('product_categories_location_idx').on(t.locationId),
	],
)

/**
 * Products Table
 *
 * Master catalog of sellable items, scoped per location.
 *
 * `sku`        — primary external-facing natural key, unique per location.
 *                All cross-system references (POS, exports, barcodes) use SKU.
 *
 * `name`       — display name, unique per location.
 *
 * `status`     — full lifecycle: active → inactive → archived.
 *                Archived products must not appear in new transactions.
 *
 * `hasVariants`          — when true, pricing and SKU are delegated to
 *                          productVariantsTable. `basePrice` acts as a fallback
 *                          only when no default variant exists.
 *
 * `hasSalesTypePricing`  — when true, per-sales-type prices are defined in
 *                          productPricesTable (or variantPricesTable).
 *                          `basePrice` / variant `basePrice` is the fallback
 *                          when no matching sales type price exists.
 *
 * `basePrice`  — canonical price in base currency.
 *                • hasVariants=false, hasSalesTypePricing=false → authoritative price.
 *                • hasVariants=false, hasSalesTypePricing=true  → fallback if no sales type match.
 *                • hasVariants=true                             → fallback if no default variant.
 *                Must be non-negative.
 *
 * `taxId`      — optional tax rule applied at product level.
 *                Per-variant tax is not supported; all variants share this tax.
 *                onDelete: 'set null' — removing a tax rule does not remove products;
 *                caller must handle null taxId (e.g. treat as tax-exempt).
 *
 * `categoryId` — optional classification. onDelete: 'set null' — removing a
 *                category uncategorizes products rather than deleting them.
 *                Category must belong to the same location (trigger-enforced).
 *
 * onDelete: 'restrict' from location — products anchor to a location.
 * Retiring a location requires explicit product migration or archival first.
 */
export const productsTable = pgTable(
	'products',
	{
		...pk,
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		categoryId: integer('category_id').references(() => productCategoriesTable.id, {
			onDelete: 'set null',
		}),
		name: text('name').notNull(),
		description: text('description'),
		sku: text('sku').notNull(),
		status: productStatusEnum('status').notNull().default('active'),
		hasVariants: boolean('has_variants').notNull().default(false),
		hasSalesTypePricing: boolean('has_sales_type_pricing').notNull().default(false),
		basePrice: numeric('base_price', { precision: 18, scale: 6 }).notNull().default('0'),
		// taxId: integer('tax_id').references(() => taxesTable.id, { onDelete: 'set null' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('products_sku_location_idx').on(t.sku, t.locationId),
		uniqueIndex('products_name_location_idx').on(t.name, t.locationId),

		// Hot path: "all active products at this location"
		index('products_location_status_idx').on(t.locationId, t.status),

		index('products_category_idx').on(t.categoryId),
		// index('products_tax_idx').on(t.taxId),

		// basePrice must be non-negative in all modes
		check('products_base_price_chk', sql`base_price >= 0`),
	],
)

/**
 * Product Prices Table
 *
 * Per-sales-type price overrides for non-variant products.
 * Only meaningful when `products.hasSalesTypePricing = true` and
 * `products.hasVariants = false`. This invariant is enforced by the service layer.
 *
 * Lookup priority (non-variant products):
 *   1. productPricesTable row matching current salesTypeId  ← this table
 *   2. products.basePrice                                   ← fallback
 *
 * onDelete: 'restrict' from salesType — a sales type in active use by
 * price rules cannot be deleted. Reassign or remove price rows first.
 */
export const productPricesTable = pgTable(
	'product_prices',
	{
		...pk,
		productId: integer('product_id')
			.notNull()
			.references(() => productsTable.id, { onDelete: 'cascade' }),
		salesTypeId: integer('sales_type_id')
			.notNull()
			.references(() => salesTypesTable.id, { onDelete: 'restrict' }),
		price: numeric('price', { precision: 18, scale: 6 }).notNull(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_prices_product_sales_type_idx').on(t.productId, t.salesTypeId),
		index('product_prices_sales_type_idx').on(t.salesTypeId),

		// Price must be non-negative
		check('product_prices_price_chk', sql`price >= 0`),
	],
)

// ─── Product Variants ─────────────────────────────────────────────────────────

/**
 * Product Variants Table
 *
 * Represents sellable SKU-level variations of a product (size, color, etc.).
 * Only meaningful when `products.hasVariants = true`. This invariant is
 * enforced by the service layer.
 *
 * `sku`        — variant-level external identifier. Unique within the product.
 *
 * `isDefault`  — exactly one variant per product must be the default.
 *                Enforced via partial unique index on (productId) WHERE is_default = TRUE.
 *                The default variant's basePrice is used as the product-level
 *                price fallback when hasSalesTypePricing = false.
 *
 * `basePrice`  — variant's canonical price.
 *                • hasSalesTypePricing=false → authoritative price for this variant.
 *                • hasSalesTypePricing=true  → fallback if no matching sales type price.
 *                Must be non-negative.
 *
 * `isActive`   — retire a discontinued variant without hard-deletion.
 *                Inactive variants must not appear in new transactions but
 *                remain for order history integrity.
 */
export const productVariantsTable = pgTable(
	'product_variants',
	{
		...pk,
		productId: integer('product_id')
			.notNull()
			.references(() => productsTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		sku: text('sku').notNull(),
		isDefault: boolean('is_default').notNull().default(false),
		basePrice: numeric('base_price', { precision: 18, scale: 6 }).notNull().default('0'),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
		uniqueIndex('product_variants_product_sku_idx').on(t.productId, t.sku),

		// Exactly one default variant per product — DB-enforced
		uniqueIndex('product_variants_default_idx')
			.on(t.productId)
			.where(eq(t.isDefault, true)),

		// basePrice must be non-negative
		check('product_variants_base_price_chk', sql`base_price >= 0`),
	],
)

/**
 * Variant Prices Table
 *
 * Per-sales-type price overrides for product variants.
 * Only meaningful when `products.hasSalesTypePricing = true` and
 * `products.hasVariants = true`. This invariant is enforced by the service layer.
 *
 * Lookup priority (variant products):
 *   1. variantPricesTable row matching (variantId, salesTypeId)  ← this table
 *   2. productVariants.basePrice                                  ← fallback
 *
 * onDelete: 'restrict' from salesType — mirrors productPricesTable behaviour.
 */
export const productVariantPricesTable = pgTable(
	'product_variant_prices',
	{
		...pk,
		variantId: integer('variant_id')
			.notNull()
			.references(() => productVariantsTable.id, { onDelete: 'cascade' }),
		salesTypeId: integer('sales_type_id')
			.notNull()
			.references(() => salesTypesTable.id, { onDelete: 'restrict' }),
		price: numeric('price', { precision: 18, scale: 6 }).notNull(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('variant_prices_variant_sales_type_idx').on(t.variantId, t.salesTypeId),
		index('variant_prices_sales_type_idx').on(t.salesTypeId),

		// Price must be non-negative
		check('variant_prices_price_chk', sql`price >= 0`),
	],
)

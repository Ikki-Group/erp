import { boolean, index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { productStatusEnum } from './_helpers'
import { auditBasicColumns, pk } from './_helpers.ts'
import { locationsTable } from './location'
import { salesTypesTable } from './sales-type'
import { taxesTable } from './tax'

export const productCategoriesTable = pgTable(
	'product_categories',
	{
		...pk,
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		description: text(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_categories_name_idx').on(t.name, t.locationId),
		index('product_categories_location_idx').on(t.locationId),
	],
)

export const productsTable = pgTable(
	'products',
	{
		...pk,
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		name: text().notNull(),
		description: text(),
		sku: text().notNull(),
		categoryId: integer().references(() => productCategoriesTable.id, { onDelete: 'set null' }),
		status: productStatusEnum().notNull().default('active'),

		hasVariants: boolean().notNull().default(false),
		hasSalesTypePricing: boolean().notNull().default(false),

		basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		taxId: integer('tax_id').references(() => taxesTable.id, { onDelete: 'set null' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('products_sku_location_idx').on(t.sku, t.locationId),
		uniqueIndex('products_name_location_idx').on(t.name, t.locationId),
		index('products_location_idx').on(t.locationId),
		index('products_category_idx').on(t.categoryId),
		index('products_status_idx').on(t.status),
		index('products_tax_idx').on(t.taxId),
	],
)

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
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_prices_product_sales_type_idx').on(t.productId, t.salesTypeId),
		index('product_prices_sales_type_idx').on(t.salesTypeId),
	],
)

export const productVariantsTable = pgTable(
	'product_variants',
	{
		...pk,
		productId: integer()
			.notNull()
			.references(() => productsTable.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		sku: text().notNull(),
		isDefault: boolean().notNull().default(false),
		basePrice: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
		uniqueIndex('product_variants_sku_idx').on(t.productId, t.sku),
	],
)

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
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('variant_prices_variant_sales_type_idx').on(t.variantId, t.salesTypeId),
		index('variant_prices_sales_type_idx').on(t.salesTypeId),
	],
)

// export const productExternalMappingsTable = pgTable(
// 	'product_external_mappings',
// 	{
// 		...pk,
// 		productId: integer()
// 			.notNull()
// 			.references(() => productsTable.id, { onDelete: 'cascade' }),
// 		variantId: integer().references(() => productVariantsTable.id, { onDelete: 'cascade' }),
// 		provider: text().notNull(),
// 		externalId: text().notNull(),
// 		externalData: jsonb(),
// 		lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
// 		...auditBasicColumns,
// 	},
// 	(t) => [
// 		uniqueIndex('product_ext_map_provider_ext_id_idx').on(t.provider, t.externalId),
// 		uniqueIndex('product_ext_map_provider_product_variant_idx').on(
// 			t.provider,
// 			t.productId,
// 			t.variantId,
// 		),
// 		index('product_ext_map_product_idx').on(t.productId),
// 		index('product_ext_map_provider_idx').on(t.provider),
// 	],
// )

// export const categoryExternalMappingsTable = pgTable(
// 	'category_external_mappings',
// 	{
// 		...pk,
// 		categoryId: integer()
// 			.notNull()
// 			.references(() => productCategoriesTable.id, { onDelete: 'cascade' }),
// 		provider: text().notNull(),
// 		externalId: text().notNull(),
// 		externalData: jsonb(),
// 		lastSyncedAt: timestamp({ mode: 'date', withTimezone: true }),
// 		...auditBasicColumns,
// 	},
// 	(t) => [
// 		uniqueIndex('category_ext_map_provider_ext_id_idx').on(t.provider, t.externalId),
// 		uniqueIndex('category_ext_map_provider_category_idx').on(t.provider, t.categoryId),
// 		index('category_ext_map_category_idx').on(t.categoryId),
// 		index('category_ext_map_provider_idx').on(t.provider),
// 	],
// )

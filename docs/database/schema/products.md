# Schema: Products

Source: `product.ts`

---

## `product_categories` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (restrict) |
| code | text | NO | | unique per location |
| name | text | NO | | unique per location |
| description | text | YES | | |

## `products` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (restrict) |
| category_id | int | YES | | FK→product_categories (set null) |
| name | text | NO | | unique per location |
| description | text | YES | | |
| sku | text | NO | | unique per location |
| status | enum | NO | active | active / inactive / archived |
| has_variants | boolean | NO | false | |
| has_sales_type_pricing | boolean | NO | false | |
| base_price | numeric(18,6) | NO | 0 | check: >= 0 |

## `product_prices` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| product_id | int | NO | | FK→products (cascade) |
| sales_type_id | int | NO | | FK→sales_types (restrict) |
| price | numeric(18,6) | NO | | check: >= 0 |

Unique: `(product_id, sales_type_id)`

## `product_variants` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| product_id | int | NO | | FK→products (cascade) |
| name | text | NO | | unique per product |
| sku | text | NO | | unique per product |
| is_default | boolean | NO | false | partial unique: 1 default/product |
| base_price | numeric(18,6) | NO | 0 | check: >= 0 |
| is_active | boolean | NO | true | |

## `product_variant_prices` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| variant_id | int | NO | | FK→product_variants (cascade) |
| sales_type_id | int | NO | | FK→sales_types (restrict) |
| price | numeric(18,6) | NO | | check: >= 0 |

Unique: `(variant_id, sales_type_id)`

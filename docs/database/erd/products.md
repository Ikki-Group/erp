# ERD: Products & Pricing

```
[sales_types]                    [product_categories]
+------------------+             +------------------+
| PK id            |             | PK id            |
|   FK location_id |             | * FK location_id |
| * code           |             | * code           |
| * name           |             | * name           |
| * is_system      |             +------------------+
+------------------+                     |
        |                                |
        |         [products]             |
        |         +--------------------------+
        |         | PK id                    |
        |         | * FK location_id         |
        |         |   FK category_id --------+
        |         | * name, sku (unique/loc) |
        |         | * status (enum)          |
        |         | * has_variants           |
        |         | * has_sales_type_pricing |
        |         | * base_price >= 0        |
        |         +--------------------------+
        |                 |            |
        |    [product_prices]    [product_variants]
        |    +------------------+ +--------------------+
        +----| * FK sales_type  | | * FK product_id    |
        |    | * FK product_id  | | * name, sku        |
        |    | * price >= 0     | | * is_default (1/prod)|
        |    +------------------+ | * base_price >= 0  |
        |     (unique: prod+st)   | * is_active        |
        |                         +--------------------+
        |                                  |
        |                  [product_variant_prices]
        +------------------| * FK sales_type_id |
                           | * FK variant_id    |
                           | * price >= 0       |
                           +--------------------+
                            (unique: variant+st)
```

## Price Resolution

```
Variant product:  variant_prices[variant+salesType] → variant.base_price
Non-variant:      product_prices[product+salesType] → product.base_price
```

## Key Rules

- Products and categories are scoped per-location (unique within location).
- `sales_types` can be global (location_id=null) or per-location.
- Exactly one default variant per product (partial unique index).
- `has_variants=true` → pricing lives on variants, not product.
- `has_sales_type_pricing=true` → price tables override base_price.

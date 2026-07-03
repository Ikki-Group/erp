# Schema Review: product.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The product.ts file contains **5 tables**:

1. `productCategoriesTable` - Per-location product classification
2. `productsTable` - Master product catalog (per-location)
3. `productPricesTable` - Per-sales-type pricing (non-variant products)
4. `productVariantsTable` - Product variations (size, color, etc.)
5. `productVariantPricesTable` - Per-sales-type pricing (variant products)

---

## ✅ Strengths

### 1. **Outstanding Documentation** ⭐⭐⭐⭐⭐

Every table has comprehensive JSDoc explaining:

- Scope and ownership (per-location design)
- Field semantics and business rules
- Pricing hierarchy and fallback logic
- Constraint enforcement (DB vs service layer)
- Foreign key behaviors

**Example - Pricing Hierarchy:**

```typescript
/**
 * Lookup priority (non-variant products):
 *   1. productPricesTable row matching current salesTypeId  ← this table
 *   2. products.basePrice                                   ← fallback
 */
```

✅ **Excellent:** Explains complex pricing logic clearly

---

### 2. **Per-Location Scoping** ⭐⭐⭐⭐⭐

**Design Pattern:**

```typescript
// Categories are per-location (NOT shared)
productCategoriesTable: {
	;(locationId, code, name) // Unique per location
}

// Products are per-location
productsTable: {
	;(locationId, sku, name) // Unique per location
}
```

**Benefits:**

- ✅ Each location has independent product catalog
- ✅ No cross-location conflicts (same SKU can exist in different locations)
- ✅ Allows location-specific pricing/categories

**Comparison with Materials:**

- Materials: Global (shared across locations)
- Products: Per-location (independent catalogs)

✅ **Excellent architecture decision** for retail/multi-store use case

---

### 3. **Partial Index for Default Variant** ⭐⭐⭐⭐⭐

```typescript
// Exactly one default variant per product — DB-enforced
uniqueIndex('product_variants_default_idx')
	.on(t.productId)
	.where(sql`is_default = TRUE`)
```

**Business Rule Enforced:**

- Each product can have only ONE default variant
- Non-default variants don't participate in uniqueness check
- DB-level enforcement (cannot be bypassed)

✅ **Perfect use case for partial index!**

---

### 4. **Flexible Pricing Strategy** ⭐⭐⭐⭐⭐

**Three-Tier Pricing System:**

```typescript
// Tier 1: Simple product (no variants, no sales type pricing)
hasVariants: false
hasSalesTypePricing: false
→ Use products.basePrice

// Tier 2: Per-sales-type pricing (wholesale, retail, member)
hasVariants: false
hasSalesTypePricing: true
→ Lookup productPricesTable → fallback to basePrice

// Tier 3: Variants + per-sales-type pricing
hasVariants: true
hasSalesTypePricing: true
→ Lookup variantPricesTable → fallback to variant.basePrice
```

✅ **Excellent:** Supports simple to complex pricing without over-engineering

---

### 5. **Check Constraints** ⭐⭐⭐⭐⭐

```typescript
// Prices can never be negative
check('products_base_price_chk', sql`base_price >= 0`)
```

✅ **Good:** Basic business rule enforced at DB level

---

### 6. **Foreign Key Strategy** ⭐⭐⭐⭐⭐

**Well-Reasoned Behaviors:**

```typescript
// Restrict: Products anchor to location
locationId: references(..., { onDelete: 'restrict' })

// Cascade: Variants/prices owned by product
productId: references(..., { onDelete: 'cascade' })

// Set Null: Category removal uncategorizes (doesn't delete products)
categoryId: references(..., { onDelete: 'set null' })

// Restrict: Sales types in use can't be deleted
salesTypeId: references(..., { onDelete: 'restrict' })
```

✅ **Perfect:** Matches data ownership and business semantics

---

### 7. **Status Lifecycle** ⭐⭐⭐⭐⭐

```typescript
status: productStatusEnum('status') // active → inactive → archived
```

**Better than simple `isActive`:**

- ✅ Three-state lifecycle (active, inactive, archived)
- ✅ Archived products excluded from new transactions
- ✅ Audit trail preserved

**Documentation explains:**

> "Archived products must not appear in new transactions."

✅ **Excellent:** Clear lifecycle management

---

## ⚠️ Issues & Improvements

### **CRITICAL: Non-Type-Safe Partial Index** 🔴

**Current Implementation:**

```typescript
// ❌ Using sql template (not type-safe)
uniqueIndex('product_variants_default_idx')
	.on(t.productId)
	.where(sql`is_default = TRUE`)
```

**Should Use Type-Safe Pattern:**

```typescript
import { eq } from 'drizzle-orm'

// ✅ Type-safe with eq() operator
uniqueIndex('product_variants_default_idx').on(t.productId).where(eq(t.isDefault, true))
```

**Why This Matters:**

- ✅ Type checking catches errors at compile time
- ✅ Consistent with project patterns (location, material)
- ✅ Drizzle v1.0.0-rc.4+ supports `.where(eq(...))`

**Files to Update:**

- Import `eq` from `drizzle-orm`
- Update partial index in `productVariantsTable`

**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **MINOR: Missing Check Constraint on Variant Price** 🟡

**Current Schema:**

```typescript
// productsTable has check constraint
check('products_base_price_chk', sql`base_price >= 0`)

// ❌ productVariantsTable missing check constraint
basePrice: numeric('base_price', { precision: 18, scale: 6 })

// ❌ productPricesTable missing check constraint
price: numeric('price', { precision: 18, scale: 6 })

// ❌ productVariantPricesTable missing check constraint
price: numeric('price', { precision: 18, scale: 6 })
```

**Inconsistency:**

- Products have non-negative price constraint
- Variants/price tables don't have same constraint
- All prices should be non-negative

**Recommendation:** **Add check constraints for consistency**

```typescript
// productVariantsTable
check('product_variants_base_price_chk', sql`base_price >= 0`)

// productPricesTable
check('product_prices_price_chk', sql`price >= 0`)

// productVariantPricesTable
check('variant_prices_price_chk', sql`price >= 0`)
```

**Impact:** ⭐⭐⭐ Data integrity + consistency

---

### **DESIGN: Product Status vs Variant isActive** 🟢

**Current Design:**

```typescript
// Products: Enum status (active, inactive, archived)
productsTable: {
	status: productStatusEnum
}

// Variants: Boolean flag
productVariantsTable: {
	isActive: boolean
}
```

**Question:** Should variants use status enum too?

**Analysis:**

| Approach              | Pros                    | Cons                                |
| --------------------- | ----------------------- | ----------------------------------- |
| **Current (boolean)** | ✅ Simpler for variants | ⚠️ Inconsistent with products       |
| **Enum for variants** | ✅ Consistent lifecycle | ⚠️ Overkill? (variants are simpler) |

**Recommendation:** **Keep current design**

**Rationale:**

- Products need full lifecycle (active → inactive → archived)
- Variants are simpler: just active/inactive
- No need for "archived" variants (product archival covers all variants)
- Simpler is better when complexity isn't needed

**Impact:** N/A (no change needed)

---

### **DESIGN: Trigger-Enforced Category Location Guard** 🟢

**Documentation Says:**

```typescript
/**
 * Cross-location assignment guard:
 *   A product must only reference a category from the same location.
 *   This is enforced via a Postgres trigger (see migrations/product_category_location_guard.sql)
 *   since Drizzle cannot express a composite FK across (categoryId, locationId)
 *   without polluting the products schema.
 */
```

**Current Limitation:**

- Drizzle ORM can't express composite FK: `FOREIGN KEY (categoryId, locationId)`
- Workaround: Postgres trigger enforces the rule

**Ideal Schema (if supported):**

```sql
FOREIGN KEY (category_id, location_id)
  REFERENCES product_categories (id, location_id)
```

**Recommendation:** **Keep current trigger approach**

**Rationale:**

- Trigger works correctly
- No good alternative in Drizzle ORM
- Documentation clearly explains the constraint

**Note for Future:**

- If Drizzle adds composite FK support, migrate to schema-level constraint
- Trigger is documented (easy to find and maintain)

**Impact:** N/A (design acknowledged, no change needed)

---

## 📝 Summary

| Category                | Rating     | Notes                                        |
| ----------------------- | ---------- | -------------------------------------------- |
| **Documentation**       | ⭐⭐⭐⭐⭐ | Outstanding clarity, pricing logic explained |
| **Per-Location Design** | ⭐⭐⭐⭐⭐ | Perfect for multi-store retail               |
| **Pricing Flexibility** | ⭐⭐⭐⭐⭐ | Three-tier system handles all cases          |
| **Foreign Keys**        | ⭐⭐⭐⭐⭐ | Well-reasoned cascade/restrict               |
| **Partial Indexes**     | ⭐⭐⭐⭐   | **Use type-safe eq()**                       |
| **Check Constraints**   | ⭐⭐⭐     | **Add to variant/price tables**              |
| **Overall**             | ⭐⭐⭐⭐⭐ | Excellent (after minor fixes)                |

---

## 🎯 Recommended Actions

### **Priority 1: Use Type-Safe Partial Index** 🔴

**Action:** Replace `sql` template with `eq()` operator

```typescript
import { eq, sql } from 'drizzle-orm' // ✅ Add eq import

// BEFORE:
uniqueIndex('product_variants_default_idx')
	.on(t.productId)
	.where(sql`is_default = TRUE`)

// AFTER:
uniqueIndex('product_variants_default_idx').on(t.productId).where(eq(t.isDefault, true))
```

**Effort:** 1 minute  
**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **Priority 2: Add Price Check Constraints** 🟡

**Action:** Add non-negative constraints to variant/price tables

```typescript
// productVariantsTable
(t) => [
  // ... existing indexes
  check('product_variants_base_price_chk', sql`base_price >= 0`),
]

// productPricesTable
(t) => [
  // ... existing indexes
  check('product_prices_price_chk', sql`price >= 0`),
]

// productVariantPricesTable
(t) => [
  // ... existing indexes
  check('variant_prices_price_chk', sql`price >= 0`),
]
```

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐ Data integrity consistency

---

### **Priority 3: No Other Changes Needed** ✅

**Schema is excellent as-is:**

- ✅ Per-location design perfect for use case
- ✅ Flexible pricing strategy
- ✅ Trigger-enforced category guard documented
- ✅ Status lifecycle appropriate

---

## 💡 Schema Best Practices Applied

✅ **Per-Location Scoping** - Products independent per location  
✅ **Flexible Pricing** - Three-tier system (simple → complex)  
✅ **Partial Index** - Exactly one default variant per product  
✅ **Foreign Key Strategy** - Cascade for owned, restrict for referenced  
✅ **Documentation** - Pricing hierarchy clearly explained  
✅ **Status Lifecycle** - Three-state enum for products  
⚠️ **Type Safety** - Use `eq()` not `sql` for partial index  
⚠️ **Check Constraints** - Add to all price fields

---

## 🔍 Table-by-Table Analysis

### 1. productCategoriesTable ⭐⭐⭐⭐⭐

**Purpose:** Per-location product classification

**Strengths:**

- ✅ Per-location scoping (code + name unique per location)
- ✅ Trigger-enforced cross-location guard
- ✅ Full audit columns

**No Changes Needed** ✅

**Example Data:**

```sql
-- Jakarta Store categories
INSERT INTO product_categories (location_id, code, name) VALUES
  (1, 'BEVERAGES', 'Beverages'),
  (1, 'SNACKS', 'Snacks');

-- Bali Store can have same codes independently
INSERT INTO product_categories (location_id, code, name) VALUES
  (2, 'BEVERAGES', 'Beverages'),
  (2, 'DESSERTS', 'Desserts');
```

---

### 2. productsTable ⭐⭐⭐⭐⭐

**Purpose:** Master product catalog (per-location)

**Strengths:**

- ✅ Per-location scoping (SKU + name unique per location)
- ✅ Flexible pricing flags (hasVariants, hasSalesTypePricing)
- ✅ Check constraint: basePrice >= 0
- ✅ Status enum: active → inactive → archived

**No Changes Needed** ✅

**Example Data:**

```sql
-- Simple product: no variants, no sales type pricing
INSERT INTO products (location_id, sku, name, base_price, has_variants, has_sales_type_pricing) VALUES
  (1, 'COKE-330', 'Coca Cola 330ml', 5000, false, false);

-- Product with variants
INSERT INTO products (location_id, sku, name, base_price, has_variants, has_sales_type_pricing) VALUES
  (1, 'TSHIRT', 'T-Shirt Basic', 50000, true, false);
```

---

### 3. productPricesTable ⭐⭐⭐⭐

**Purpose:** Per-sales-type pricing (non-variant products)

**Strengths:**

- ✅ Unique on (productId, salesTypeId)
- ✅ Cascade delete with product
- ✅ Restrict delete on sales type

**Improvements:**

- ⚠️ Add check constraint: price >= 0

**Example Data:**

```sql
-- Coca Cola pricing by sales type
INSERT INTO product_prices (product_id, sales_type_id, price) VALUES
  (1, 1, 5000),   -- Retail
  (1, 2, 4500),   -- Wholesale
  (1, 3, 4800);   -- Member
```

---

### 4. productVariantsTable ⭐⭐⭐⭐

**Purpose:** Product variations (size, color, etc.)

**Strengths:**

- ✅ Partial unique index: exactly one default per product
- ✅ Unique on (productId, name)
- ✅ Unique on (productId, sku)
- ✅ Soft delete with isActive

**Improvements:**

- ⚠️ Use `eq()` for type-safe partial index
- ⚠️ Add check constraint: basePrice >= 0

**Example Data:**

```sql
-- T-Shirt variants
INSERT INTO product_variants (product_id, name, sku, base_price, is_default) VALUES
  (2, 'Small', 'TSHIRT-S', 50000, false),
  (2, 'Medium', 'TSHIRT-M', 50000, true),   -- Default
  (2, 'Large', 'TSHIRT-L', 55000, false);
```

---

### 5. productVariantPricesTable ⭐⭐⭐⭐

**Purpose:** Per-sales-type pricing (variant products)

**Strengths:**

- ✅ Unique on (variantId, salesTypeId)
- ✅ Cascade delete with variant
- ✅ Restrict delete on sales type

**Improvements:**

- ⚠️ Add check constraint: price >= 0

**Example Data:**

```sql
-- T-Shirt Medium pricing by sales type
INSERT INTO product_variant_prices (variant_id, sales_type_id, price) VALUES
  (2, 1, 50000),   -- Retail
  (2, 2, 45000),   -- Wholesale
  (2, 3, 48000);   -- Member
```

---

## 🎯 Design Patterns Highlighted

### Pattern 1: Per-Location Scoping ⭐⭐⭐⭐⭐

**Why Per-Location?**

```typescript
// Unique per location (NOT globally unique)
uniqueIndex('products_sku_location_idx').on(t.sku, t.locationId)
uniqueIndex('products_name_location_idx').on(t.name, t.locationId)
```

**Use Case:**

- **Jakarta Store:** SKU "COKE-330" = Coca Cola 330ml
- **Bali Store:** SKU "COKE-330" = Different supplier/pricing

**Benefits:**

- ✅ Each location manages independent catalog
- ✅ No cross-location SKU conflicts
- ✅ Location-specific pricing/categories

**Comparison:**

- Materials: Global (sugar is sugar everywhere)
- Products: Per-location (retail catalog varies by store)

---

### Pattern 2: Flexible Pricing Hierarchy ⭐⭐⭐⭐⭐

**Decision Tree:**

```
Q: Does product have variants?
├─ NO
│  ├─ Q: Has sales type pricing?
│  │  ├─ NO  → Use products.basePrice
│  │  └─ YES → Lookup productPricesTable → fallback to products.basePrice
│  └─
└─ YES
   ├─ Get default variant OR selected variant
   ├─ Q: Has sales type pricing?
   │  ├─ NO  → Use variant.basePrice
   │  └─ YES → Lookup variantPricesTable → fallback to variant.basePrice
   └─
```

**Example Scenarios:**

```typescript
// Scenario 1: Simple product
{
  hasVariants: false,
  hasSalesTypePricing: false,
  basePrice: 5000
}
→ Price = 5000

// Scenario 2: Sales type pricing
{
  hasVariants: false,
  hasSalesTypePricing: true,
  basePrice: 5000,
  prices: [
    { salesTypeId: 1, price: 5000 },  // Retail
    { salesTypeId: 2, price: 4500 },  // Wholesale
  ]
}
→ Price (retail) = 5000
→ Price (wholesale) = 4500

// Scenario 3: Variants + sales type pricing
{
  hasVariants: true,
  hasSalesTypePricing: true,
  variants: [
    {
      name: 'Medium',
      basePrice: 50000,
      isDefault: true,
      prices: [
        { salesTypeId: 1, price: 50000 },
        { salesTypeId: 2, price: 45000 },
      ]
    }
  ]
}
→ Price (retail, medium) = 50000
→ Price (wholesale, medium) = 45000
```

---

### Pattern 3: Partial Index for Business Rule ⭐⭐⭐⭐⭐

**Business Rule:**

> "Exactly one variant per product must be the default."

**Implementation:**

```typescript
uniqueIndex('product_variants_default_idx').on(t.productId).where(eq(t.isDefault, true)) // ✅ After fix
```

**How It Works:**

```sql
-- ✅ Allowed: First default variant for product 1
INSERT INTO product_variants (product_id, name, is_default)
VALUES (1, 'Small', true);

-- ❌ Rejected: Second default variant for product 1
INSERT INTO product_variants (product_id, name, is_default)
VALUES (1, 'Medium', true);
-- ERROR: duplicate key value violates unique constraint "product_variants_default_idx"

-- ✅ Allowed: Non-default variants don't conflict
INSERT INTO product_variants (product_id, name, is_default)
VALUES (1, 'Medium', false);
INSERT INTO product_variants (product_id, name, is_default)
VALUES (1, 'Large', false);
```

**Benefits:**

- ✅ DB-level enforcement (cannot be bypassed)
- ✅ No application code needed for validation
- ✅ Clear error on violation

---

## 🔗 Cross-Schema Dependencies

**Depends On:**

- ✅ `locationsTable` - Per-location scoping
- ✅ `salesTypesTable` - Per-sales-type pricing
- ✅ `productStatusEnum` (from `_enums.ts`) - Status lifecycle
- ⚠️ `taxesTable` - Commented out (future use)

**Used By:**

- Sales module (order line items)
- Inventory module (stock tracking per product)
- POS module (retail transactions)

---

## 🧪 Example Queries

### Query 1: Get Product with Variants

```sql
SELECT
  p.sku,
  p.name,
  p.base_price,
  json_agg(
    json_build_object(
      'name', v.name,
      'sku', v.sku,
      'price', v.base_price,
      'isDefault', v.is_default
    )
  ) FILTER (WHERE v.id IS NOT NULL) as variants
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id AND v.is_active
WHERE p.location_id = 1
  AND p.status = 'active'
GROUP BY p.id;
```

---

### Query 2: Get Price for Sales Type

```sql
-- Get retail price for product (with fallback)
SELECT
  COALESCE(pp.price, p.base_price) as final_price
FROM products p
LEFT JOIN product_prices pp
  ON p.id = pp.product_id
  AND pp.sales_type_id = 1  -- Retail
WHERE p.id = 1;
```

---

### Query 3: Active Products by Category

```sql
SELECT
  c.name as category,
  COUNT(*) as product_count,
  AVG(p.base_price) as avg_price
FROM products p
JOIN product_categories c ON p.category_id = c.id
WHERE p.location_id = 1
  AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY product_count DESC;
```

---

## 📊 Numeric Precision Analysis

**All Price Fields:**

```typescript
precision: 18, scale: 6
```

**Consistent with Materials:**

- Materials use same precision (18, 6)
- Prevents precision loss in calculations
- Handles fractional pricing (e.g., 4999.995000)

**Examples:**

```
999,999,999,999.999999  // Max value
0.000001                 // Min non-zero value
```

✅ **Good:** Consistent precision across all monetary fields

---

## 🎓 Key Learnings

### 1. **Per-Location vs Global Design**

**When to use Per-Location:**

- Products (SKUs vary by store)
- Categories (classification differs)
- Pricing (location-specific)

**When to use Global:**

- Materials (raw materials are universal)
- UOMs (KG is KG everywhere)
- Roles (permissions are system-wide)

---

### 2. **Trigger for Complex Constraints**

**When Drizzle Can't Express:**

- Composite foreign keys
- Cross-table business rules
- Complex conditional constraints

**Workaround:** PostgreSQL trigger + documentation

---

### 3. **Flexible Pricing Architecture**

**Design Decision:**

- Flags: `hasVariants`, `hasSalesTypePricing`
- Fallback: `basePrice` always available
- Override tables: Optional complexity

**Benefits:**

- ✅ Start simple, add complexity as needed
- ✅ No over-engineering
- ✅ Clear upgrade path

---

**Status:** ✅ Schema is excellent, two minor improvements recommended  
**Next:** Apply type-safe index and add check constraints

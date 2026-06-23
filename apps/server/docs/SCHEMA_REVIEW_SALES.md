# Schema Review: sales.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The sales.ts file contains **8 tables**:
1. `salesOrdersTable` - Sales order header
2. `salesOrderBatchesTable` - Batch delivery tracking
3. `salesOrderItemsTable` - Order line items
4. `salesInvoicesTable` - Invoice header
5. `salesInvoiceItemsTable` - Invoice line items
6. `salesVoidsTable` - Void tracking (order/item level)
7. `salesRefundsTable` - Refund tracking (order/item level)
8. `salesExternalRefsTable` - Third-party integration (Grab, Shopee, Moka)

---

## ✅ Strengths

### 1. **Immutable History Pattern** ⭐⭐⭐⭐⭐

```typescript
salesOrderItemsTable: {
  // Immutable History: Item name must always be stored
  itemName: text().notNull(),
  
  // Even if product is deleted, order history preserved
  productId: integer().references(() => productsTable.id, { onDelete: 'set null' })
}
```

**Benefits:**
- ✅ Order history never breaks (even if product deleted/renamed)
- ✅ Audit trail complete
- ✅ Financial reporting accurate

✅ **Excellent:** Critical for sales/accounting compliance

---

### 2. **Flexible Product References** ⭐⭐⭐⭐⭐

```typescript
salesOrderItemsTable: {
  // Optional: Support custom items (no product link)
  productId: integer().references(..., { onDelete: 'set null' }),
  variantId: integer().references(..., { onDelete: 'set null' }),
  
  // Always required: Store display name
  itemName: text().notNull()
}
```

**Use Cases:**
- ✅ Regular products (productId set)
- ✅ Product variants (variantId set)
- ✅ Custom items (both null, itemName only)

✅ **Perfect:** Handles all sales scenarios

---

### 3. **Comprehensive Financial Tracking** ⭐⭐⭐⭐⭐

**Order Level:**
```typescript
salesOrdersTable: {
  totalAmount, discountAmount, taxAmount,
  gratuityAmount,  // Tips/service charge
  refundAmount     // Total refunded
}
```

**Item Level:**
```typescript
salesOrderItemsTable: {
  quantity, unitPrice, discountAmount, taxAmount, subtotal
}
```

✅ **Outstanding:** Complete financial breakdown

---

### 4. **Batch Delivery Support** ⭐⭐⭐⭐⭐

```typescript
salesOrderBatchesTable: {
  orderId, batchNumber, status  // pending, prepared, delivered
}

salesOrderItemsTable: {
  batchId  // Link item to batch
}
```

**Use Case:**
- Order placed: 10 items
- Batch 1 (5 items): prepared
- Batch 2 (5 items): pending

✅ **Excellent:** Supports partial fulfillment

---

### 5. **Void vs Refund Separation** ⭐⭐⭐⭐⭐

**Void (Pre-Payment):**
```typescript
salesVoidsTable: {
  orderId, itemId, reason, voidedBy
  // No amount field: void before payment
}
```

**Refund (Post-Payment):**
```typescript
salesRefundsTable: {
  orderId, itemId, amount, reason, refundedBy, refundedAt
}
```

✅ **Perfect:** Clear distinction for accounting

---

### 6. **External Integration Support** ⭐⭐⭐⭐⭐

```typescript
salesExternalRefsTable: {
  externalSource: 'Grab', 'Shopee', 'Moka',
  externalOrderId,
  rawPayload  // Full JSON for debugging
}
```

**Benefits:**
- ✅ Link to third-party platforms
- ✅ Unique constraint prevents duplicate imports
- ✅ Raw payload preserved for audit

✅ **Excellent:** Ready for multi-channel retail

---

### 7. **Metadata Fields (JSONB)** ⭐⭐⭐⭐⭐

```typescript
salesOrdersTable: {
  metadata: jsonb()  // split_payment_details, payment_type, etc.
}
```

**Benefits:**
- ✅ Flexible schema for integration data
- ✅ No schema changes for new fields
- ✅ PostgreSQL JSONB indexable/queryable

✅ **Good:** Extensibility without migrations

---

### 8. **Invoice Separation** ⭐⭐⭐⭐⭐

**Order (Operational):**
```typescript
salesOrdersTable: { locationId, customerId, status }
```

**Invoice (Financial):**
```typescript
salesInvoicesTable: { orderId, invoiceDate, dueDate, status }
```

**Benefits:**
- ✅ One order can have multiple invoices (installments)
- ✅ Order ≠ invoice (payment terms)
- ✅ Clear accounting separation

✅ **Excellent:** Proper financial architecture

---

## ⚠️ Issues & Improvements

### **CRITICAL: Missing Explicit Column Names** 🔴

**Current Schema (ALL tables affected):**
```typescript
// ❌ Missing column names
locationId: integer()
  .notNull()
  .references(() => locationsTable.id, { onDelete: 'restrict' })

customerId: integer()
  .references(() => customersTable.id, { onDelete: 'set null' })

source: salesOrderSourceEnum().notNull().default('web')
```

**Should Have:**
```typescript
// ✅ Explicit column names
locationId: integer('location_id')
  .notNull()
  .references(() => locationsTable.id, { onDelete: 'restrict' })

customerId: integer('customer_id')
  .references(() => customersTable.id, { onDelete: 'set null' })

source: salesOrderSourceEnum('source').notNull().default('web')
```

**Impact:** ⭐⭐⭐⭐⭐ Consistency with all other schemas

---

### **MINOR: Quantity Precision (Scale 4 vs 6)** 🟡

**Current:**
```typescript
// sales.ts uses scale 4
quantity: numeric({ precision: 18, scale: 4 })

// inventory.ts now uses scale 6 (after review)
qty: numeric('qty', { precision: 18, scale: 6 })
```

**Question:** Should sales match inventory's scale 6?

**Analysis:**

| Use Case | Scale 4 | Scale 6 |
|----------|---------|---------|
| Regular products (PCS) | ✅ 1.0000 | ✅ 1.000000 |
| Weight-based (KG) | ✅ 0.1250 | ✅ 0.125000 |
| High precision (mg) | ⚠️ 0.0001 | ✅ 0.000001 |

**Recommendation:** **Change to scale 6 for consistency**

**Rationale:**
- Inventory uses scale 6 (after review)
- Sales quantities derive from inventory
- Prevents precision loss in conversions
- Consistency trumps "sufficient precision"

**Impact:** ⭐⭐⭐⭐ Consistency with inventory.ts

---

### **MINOR: Missing Check Constraints** 🟡

**Current:**
```typescript
// No check constraints for:
// - totalAmount, discountAmount, taxAmount (should be non-negative)
// - quantity (should be positive)
// - unitPrice (should be non-negative)
// - amount (refunds, should be positive)
```

**Recommendation:** **Add check constraints for data integrity**

```typescript
// salesOrdersTable
check('sales_orders_total_nonneg_chk', sql`total_amount >= 0`)
check('sales_orders_discount_nonneg_chk', sql`discount_amount >= 0`)
check('sales_orders_tax_nonneg_chk', sql`tax_amount >= 0`)

// salesOrderItemsTable
check('sales_order_items_qty_pos_chk', sql`quantity > 0`)
check('sales_order_items_unit_price_nonneg_chk', sql`unit_price >= 0`)

// salesRefundsTable
check('sales_refunds_amount_pos_chk', sql`amount > 0`)
```

**Impact:** ⭐⭐⭐ Data integrity

---

### **DESIGN: Batch Status (text vs enum)** 🟢

**Current:**
```typescript
salesOrderBatchesTable: {
  status: text().notNull().default('pending')  // No enum!
}
```

**Comparison:**
```typescript
// Other tables use enums
salesOrdersTable: {
  status: salesOrderStatusEnum().notNull()  // ✅ Enum
}
```

**Recommendation:** **Create batchStatusEnum for consistency**

```typescript
// In _enums.ts
export const batchStatusEnum = pgEnum('batch_status', [
  'pending', 'prepared', 'delivered', 'cancelled'
])

// In sales.ts
status: batchStatusEnum('status').notNull().default('pending')
```

**Impact:** ⭐⭐⭐ Type safety + consistency

---

### **DESIGN: Invoice Items Link to Order Items** 🟢

**Current:**
```typescript
salesInvoiceItemsTable: {
  salesOrderItemId: integer().references(..., { onDelete: 'set null' })
}
```

**Question:** Should this be nullable or required?

**Analysis:**

| Scenario | salesOrderItemId |
|----------|------------------|
| Invoice from order | ✅ Set (link preserved) |
| Manual invoice (no order) | ⚠️ Null (allowed) |
| Order item deleted | ⚠️ Null (onDelete: 'set null') |

**Recommendation:** **Keep current design (nullable)**

**Rationale:**
- Supports manual invoices (no order)
- History preserved even if order item deleted
- Flexibility for edge cases

**Impact:** N/A (no change needed)

---

### **MINOR: Missing Documentation** 🟡

**Current:**
- Some inline comments (e.g., "Immutable History")
- No table-level JSDoc like material.ts/product.ts

**Recommendation:** **Add comprehensive JSDoc for each table**

**Impact:** ⭐⭐⭐ Developer experience

---

## 📝 Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Immutable History** | ⭐⭐⭐⭐⭐ | Perfect for audit trail |
| **Flexible Products** | ⭐⭐⭐⭐⭐ | Regular, variants, custom items |
| **Financial Tracking** | ⭐⭐⭐⭐⭐ | Complete breakdown |
| **Batch Delivery** | ⭐⭐⭐⭐⭐ | Partial fulfillment support |
| **Void vs Refund** | ⭐⭐⭐⭐⭐ | Clear accounting separation |
| **External Integration** | ⭐⭐⭐⭐⭐ | Multi-channel ready |
| **Column Names** | ⭐⭐⭐ | **Add explicit names** |
| **Precision** | ⭐⭐⭐⭐ | **Change qty to scale 6** |
| **Check Constraints** | ⭐⭐⭐ | **Add for amounts** |
| **Batch Status** | ⭐⭐⭐⭐ | **Use enum instead of text** |
| **Overall** | ⭐⭐⭐⭐⭐ | Excellent (after fixes) |

---

## 🎯 Recommended Actions

### **Priority 1: Add Explicit Column Names** 🔴

**Action:** Add column name string to all field definitions

**Affected Tables:** ALL (8 tables need updates)

**Effort:** 15 minutes (many fields to update)  
**Impact:** ⭐⭐⭐⭐⭐ Consistency

---

### **Priority 2: Change Quantity Precision to Scale 6** 🟡

**Action:** Update quantity fields from scale 4 to scale 6

```typescript
// BEFORE:
quantity: numeric({ precision: 18, scale: 4 })

// AFTER:
quantity: numeric('quantity', { precision: 18, scale: 6 })
```

**Affected Tables:**
- `salesOrderItemsTable.quantity`
- `salesInvoiceItemsTable.quantity`

**Effort:** 2 minutes  
**Impact:** ⭐⭐⭐⭐ Consistency with inventory.ts

---

### **Priority 3: Add Check Constraints** 🟡

**Action:** Add constraints for amount/quantity fields

**Effort:** 5 minutes  
**Impact:** ⭐⭐⭐ Data integrity

---

### **Priority 4: Create Batch Status Enum** 🟢

**Action:** Move from `text` to enum for batch status

**Effort:** 3 minutes (requires _enums.ts update)  
**Impact:** ⭐⭐⭐ Type safety

---

### **Priority 5: Add Documentation** 🟢

**Action:** Add comprehensive JSDoc for each table

**Effort:** 20 minutes  
**Impact:** ⭐⭐⭐ Developer experience

---

## 💡 Schema Best Practices Applied

✅ **Immutable History** - Item names stored, history preserved  
✅ **Flexible References** - Optional product/variant links  
✅ **Financial Separation** - Order vs Invoice  
✅ **Batch Tracking** - Partial fulfillment  
✅ **Void vs Refund** - Clear accounting distinction  
✅ **External Integration** - Multi-channel ready  
✅ **Metadata (JSONB)** - Extensibility  
⚠️ **Explicit Names** - Add column name strings  
⚠️ **Precision** - Match inventory.ts scale (6 for qty)  
⚠️ **Check Constraints** - Add for amounts  
⚠️ **Batch Status** - Use enum not text

---

## 🔍 Table-by-Table Analysis

### 1. salesOrdersTable ⭐⭐⭐⭐⭐

**Purpose:** Sales order header

**Strengths:**
- ✅ Complete financial fields
- ✅ Source enum (web, pos, api, etc.)
- ✅ Status enum (open, completed, cancelled)
- ✅ JSONB metadata for integrations

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Add check constraints (amounts >= 0)

---

### 2. salesOrderBatchesTable ⭐⭐⭐⭐

**Purpose:** Batch delivery tracking

**Strengths:**
- ✅ Supports partial fulfillment
- ✅ Batch number sequence

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Use enum for status (not text)

---

### 3. salesOrderItemsTable ⭐⭐⭐⭐⭐

**Purpose:** Order line items

**Strengths:**
- ✅ Immutable history (itemName always stored)
- ✅ Optional product/variant links
- ✅ Complete financial breakdown
- ✅ Batch tracking support

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Change quantity to scale 6
- ⚠️ Add check constraints

---

### 4. salesInvoicesTable ⭐⭐⭐⭐⭐

**Purpose:** Invoice header

**Strengths:**
- ✅ Separate from orders (proper accounting)
- ✅ Status enum (draft, sent, paid, overdue, cancelled)
- ✅ Due date tracking
- ✅ Links to order

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Add check constraints

---

### 5. salesInvoiceItemsTable ⭐⭐⭐⭐⭐

**Purpose:** Invoice line items

**Strengths:**
- ✅ Links to order items (optional)
- ✅ Immutable history (itemName stored)
- ✅ Complete financial breakdown

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Change quantity to scale 6
- ⚠️ Add check constraints

---

### 6. salesVoidsTable ⭐⭐⭐⭐⭐

**Purpose:** Void tracking (pre-payment)

**Strengths:**
- ✅ Order-level or item-level voids
- ✅ Reason tracking
- ✅ User accountability (voidedBy)
- ✅ JSONB metadata

**Improvements:**
- ⚠️ Add explicit column names

---

### 7. salesRefundsTable ⭐⭐⭐⭐⭐

**Purpose:** Refund tracking (post-payment)

**Strengths:**
- ✅ Amount tracking (unlike voids)
- ✅ Order-level or item-level refunds
- ✅ Timestamp tracking (refundedAt)
- ✅ User accountability (refundedBy)

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Add check constraint (amount > 0)

---

### 8. salesExternalRefsTable ⭐⭐⭐⭐⭐

**Purpose:** Third-party integration

**Strengths:**
- ✅ Unique constraint prevents duplicate imports
- ✅ Raw payload preserved
- ✅ Multiple sources supported

**Improvements:**
- ⚠️ Add explicit column names

---

## 🎯 Design Patterns Highlighted

### Pattern 1: Immutable History ⭐⭐⭐⭐⭐

**Problem:** Product renamed/deleted → order history broken

**Solution:**
```typescript
salesOrderItemsTable: {
  productId: integer().references(..., { onDelete: 'set null' }),
  itemName: text().notNull()  // ✅ Always preserved
}
```

**Example:**
```sql
-- T0: Create order
INSERT INTO sales_order_items (product_id, item_name, unit_price)
VALUES (1, 'Coca Cola 330ml', 5000);

-- T1: Product renamed
UPDATE products SET name = 'Coca-Cola Can 330ml' WHERE id = 1;

-- T2: Query order (itemName unchanged)
SELECT item_name FROM sales_order_items;
-- Result: 'Coca Cola 330ml' ✅ Original name preserved

-- T3: Product deleted
DELETE FROM products WHERE id = 1;

-- T4: Query order (still works)
SELECT item_name FROM sales_order_items;
-- Result: 'Coca Cola 330ml' ✅ History intact
```

---

### Pattern 2: Flexible Product References ⭐⭐⭐⭐⭐

**Three Scenarios:**

```typescript
// Scenario 1: Regular product
{
  productId: 1,
  variantId: null,
  itemName: 'Coca Cola 330ml'
}

// Scenario 2: Product variant
{
  productId: 2,
  variantId: 5,
  itemName: 'T-Shirt Basic - Medium'
}

// Scenario 3: Custom item (no product link)
{
  productId: null,
  variantId: null,
  itemName: 'Custom Cake Decoration'
}
```

---

### Pattern 3: Void vs Refund ⭐⭐⭐⭐⭐

**Void (Before Payment):**
```sql
-- Customer changes mind before paying
INSERT INTO sales_voids (order_id, item_id, reason, voided_by)
VALUES (1, 5, 'Customer changed order', 10);

-- No amount field: nothing was paid yet
```

**Refund (After Payment):**
```sql
-- Customer returns item after payment
INSERT INTO sales_refunds (order_id, item_id, amount, reason, refunded_by, refunded_at)
VALUES (1, 5, 5000, 'Item defective', 10, NOW());

-- Amount tracked: cash/credit reversed
```

**Accounting:**
- Void: No financial impact (transaction cancelled)
- Refund: Financial impact (revenue reversal)

---

### Pattern 4: External Integration ⭐⭐⭐⭐⭐

**Prevent Duplicate Import:**
```typescript
uniqueIndex('sales_external_refs_source_ext_id_idx')
  .on(t.externalSource, t.externalOrderId)
```

**Example:**
```sql
-- First import from Grab
INSERT INTO sales_external_refs (order_id, external_source, external_order_id)
VALUES (1, 'Grab', 'GR-2024-001');

-- ✅ Success

-- Duplicate import attempt
INSERT INTO sales_external_refs (order_id, external_source, external_order_id)
VALUES (2, 'Grab', 'GR-2024-001');

-- ❌ ERROR: duplicate key value violates unique constraint
```

---

## 🔗 Cross-Schema Dependencies

**Depends On:**
- ✅ `locationsTable` - Where sale occurred
- ✅ `customersTable` - Who purchased
- ✅ `productsTable`, `productVariantsTable` - What was sold
- ✅ `salesTypesTable` - Pricing tier (retail, wholesale, member)
- ✅ `usersTable` - Who processed void/refund
- ✅ Enums: `salesOrderSourceEnum`, `salesOrderStatusEnum`, `invoiceStatusEnum`

**Used By:**
- Inventory module (stock deduction on sale)
- Finance module (revenue recognition)
- Reporting module (sales analytics)

---

## 🧪 Example Queries

### Query 1: Order with Items
```sql
SELECT 
  so.id,
  so.transaction_date,
  so.total_amount,
  json_agg(
    json_build_object(
      'itemName', soi.item_name,
      'quantity', soi.quantity,
      'unitPrice', soi.unit_price,
      'subtotal', soi.subtotal
    )
  ) as items
FROM sales_orders so
JOIN sales_order_items soi ON so.id = soi.order_id
WHERE so.id = 1
GROUP BY so.id;
```

---

### Query 2: Total Refunds by Date
```sql
SELECT 
  DATE(refunded_at) as refund_date,
  COUNT(*) as refund_count,
  SUM(amount) as total_refunded
FROM sales_refunds
WHERE refunded_at BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY DATE(refunded_at)
ORDER BY refund_date;
```

---

### Query 3: External Orders
```sql
SELECT 
  so.id,
  so.total_amount,
  ser.external_source,
  ser.external_order_id
FROM sales_orders so
JOIN sales_external_refs ser ON so.id = ser.order_id
WHERE ser.external_source = 'Grab'
  AND so.transaction_date >= '2024-01-01';
```

---

## 📊 Numeric Precision Analysis

**Current:**
| Field Type | Precision | Scale | Example |
|------------|-----------|-------|---------|
| Quantity | 18 | **4** | 1234.5678 |
| Amount | 18 | 2 | 10500.50 |

**Inventory.ts (after review):**
| Field Type | Precision | Scale | Example |
|------------|-----------|-------|---------|
| Quantity | 18 | **6** | 1234.567890 |

**Recommendation:** **Change quantity scale to 6 for consistency**

---

**Status:** ✅ Schema is excellent, four improvements recommended  
**Next:** Apply fixes (explicit column names, precision, check constraints, batch status enum)

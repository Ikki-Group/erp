# Schema Review: inventory.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The inventory.ts file contains **5 tables**:
1. `stockBatchesTable` - Batch/lot tracking with expiry dates
2. `stockAdjustmentsTable` - Stock opname header (adjustments)
3. `stockAdjustmentItemsTable` - Adjustment line items
4. `stockTransactionsTable` - Event log (all stock movements)
5. `stockSummariesTable` - Daily snapshot/aggregation

---

## ✅ Strengths

### 1. **Event Sourcing Pattern** ⭐⭐⭐⭐⭐

**Architecture:**
```typescript
// Event log (immutable, append-only)
stockTransactionsTable: {
  materialId, locationId, type, qty, unitCost
  runningQty, runningAvgCost  // Snapshot after this event
}

// Projection (daily aggregation)
stockSummariesTable: {
  materialId, locationId, date
  openingQty, movements..., closingQty
}
```

**Benefits:**
- ✅ Complete audit trail (every movement tracked)
- ✅ Recalculate from events if projection corrupted
- ✅ Running totals for quick queries

✅ **Excellent:** Matches material.ts CQRS pattern

---

### 2. **Batch/Lot Tracking Support** ⭐⭐⭐⭐⭐

```typescript
stockBatchesTable: {
  materialId, batchNo, expiryDate, productionDate
}

// Linked to transactions
stockTransactionsTable: {
  batchId  // Optional batch tracking
}
```

**Use Cases:**
- ✅ Pharmaceutical (expiry tracking)
- ✅ Food & beverage (production date, FIFO/FEFO)
- ✅ Manufacturing (lot traceability)

✅ **Excellent:** Enterprise-grade inventory feature

---

### 3. **Comprehensive Movement Tracking** ⭐⭐⭐⭐⭐

**Transaction Types:**
```typescript
type: transactionTypeEnum  // purchase, transfer_in, transfer_out, adjustment, usage, production_in, production_out, sell
```

**Daily Summary Breakdown:**
```typescript
stockSummariesTable: {
  purchaseQty, purchaseValue,
  transferInQty, transferInValue,
  transferOutQty, transferOutValue,
  adjustmentQty, adjustmentValue,
  usageQty, usageValue,
  productionInQty, productionInValue,
  productionOutQty, productionOutValue,
  sellQty, sellValue
}
```

✅ **Outstanding:** Every movement type tracked separately for reporting

---

### 4. **Running Totals in Event Log** ⭐⭐⭐⭐⭐

```typescript
stockTransactionsTable: {
  qty, unitCost, totalCost,         // This transaction
  runningQty, runningAvgCost        // After this transaction
}
```

**Benefits:**
- ✅ Quick "current stock" query (last transaction's runningQty)
- ✅ Audit trail (can verify calculations)
- ✅ No need to replay all events for current state

✅ **Excellent:** Performance optimization without losing auditability

---

### 5. **Transfer Support** ⭐⭐⭐⭐⭐

```typescript
stockTransactionsTable: {
  counterpartLocationId,  // Where transfer came from/went to
  transferId              // Link both sides of transfer
}
```

**Pattern:**
```sql
-- Transfer from Jakarta (locationId=1) to Bali (locationId=2)
-- Transaction 1: Transfer OUT from Jakarta
INSERT INTO stock_transactions (materialId, locationId, type, counterpartLocationId, transferId)
VALUES (1, 1, 'transfer_out', 2, 123);

-- Transaction 2: Transfer IN to Bali
INSERT INTO stock_transactions (materialId, locationId, type, counterpartLocationId, transferId)
VALUES (1, 2, 'transfer_in', 1, 123);
```

✅ **Perfect:** Both sides linked for reconciliation

---

### 6. **Soft Delete on Summaries** ⭐⭐⭐⭐⭐

```typescript
stockSummariesTable: {
  ...auditFullColumns,  // Includes deletedAt
}

// Partial unique index excludes soft-deleted rows
uniqueIndex('stock_summaries_material_location_date_idx')
  .on(t.materialId, t.locationId, t.date)
  .where(sql`${t.deletedAt} IS NULL`)
```

**Benefits:**
- ✅ Recalculate daily summary without violating unique constraint
- ✅ Keep history of corrections
- ✅ Audit trail of recalculations

✅ **Excellent:** Allows summary rebuilds

---

### 7. **Numeric Precision Strategy** ⭐⭐⭐⭐⭐

**Quantity Fields:**
```typescript
qty: numeric({ precision: 18, scale: 4 })  // 0.0125 kg precision
```

**Cost/Value Fields:**
```typescript
unitCost: numeric({ precision: 18, scale: 2 })   // IDR precision
totalCost: numeric({ precision: 18, scale: 2 })  // IDR precision
```

**Rationale:**
- ✅ Quantity scale: 4 (handles fractional UOM conversions)
- ✅ Cost scale: 2 (standard currency precision)
- ✅ Different precision for different purposes

✅ **Good:** Appropriate precision for each field type

---

### 8. **Performance Indexes** ⭐⭐⭐⭐⭐

**Hot Queries Covered:**
```typescript
// Get all transactions for material at location
index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date)

// Location-wide movements by date
index('stock_txn_location_date_idx').on(t.locationId, t.date)

// Transfer reconciliation
index('stock_txn_transfer_idx').on(t.transferId)

// Batch expiry tracking
index('stock_batches_expiry_idx').on(t.expiryDate)
```

✅ **Excellent:** All expected query patterns optimized

---

## ⚠️ Issues & Improvements

### **CRITICAL: Non-Type-Safe Partial Index** 🔴

**Current Implementation:**
```typescript
// ❌ Using sql template (not type-safe)
uniqueIndex('stock_summaries_material_location_date_idx')
  .on(t.materialId, t.locationId, t.date)
  .where(sql`${t.deletedAt} IS NULL`)
```

**Should Use Type-Safe Pattern:**
```typescript
import { eq, isNull } from 'drizzle-orm'

// ✅ Type-safe with isNull() operator
uniqueIndex('stock_summaries_material_location_date_idx')
  .on(t.materialId, t.locationId, t.date)
  .where(isNull(t.deletedAt))
```

**Why This Matters:**
- ✅ Type checking catches errors at compile time
- ✅ Consistent with project patterns (location, material, product)
- ✅ Drizzle v1.0.0-rc.4+ supports `.where(isNull(...))`

**Files to Update:**
- Import `isNull` from `drizzle-orm`
- Update partial index in `stockSummariesTable`

**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **CRITICAL: Missing Column Names** 🔴

**Current Schema:**
```typescript
stockBatchesTable: {
  materialId: integer()  // ❌ Missing column name!
    .notNull()
    .references(() => materialsTable.id, { onDelete: 'cascade' }),
}

stockAdjustmentsTable: {
  locationId: integer()  // ❌ Missing column name!
    .notNull()
    .references(() => locationsTable.id, { onDelete: 'restrict' }),
  type: stockAdjustmentTypeEnum()  // ❌ Missing column name!
    .notNull(),
}

stockAdjustmentItemsTable: {
  adjustmentId: integer()  // ❌ Missing column name!
    .notNull()
    .references(() => stockAdjustmentsTable.id, { onDelete: 'cascade' }),
  // ... more missing column names
}

stockTransactionsTable: {
  materialId: integer()  // ❌ Missing column name!
    .notNull()
    .references(() => materialsTable.id, { onDelete: 'restrict' }),
  // ... more missing column names
}

stockSummariesTable: {
  materialId: integer()  // ❌ Missing column name!
    .notNull()
    .references(() => materialsTable.id, { onDelete: 'restrict' }),
  // ... more missing column names
}
```

**Problem:**
- Drizzle ORM should infer column names from object keys
- BUT explicit column names are best practice for clarity
- Inconsistent with other schemas (location.ts, material.ts, product.ts all use explicit names)

**Recommendation:** **Add explicit column names**

```typescript
// BEFORE:
materialId: integer()
  .notNull()
  .references(() => materialsTable.id, { onDelete: 'cascade' })

// AFTER:
materialId: integer('material_id')
  .notNull()
  .references(() => materialsTable.id, { onDelete: 'cascade' })
```

**Impact:** ⭐⭐⭐⭐⭐ Consistency + explicitness + migration safety

---

### **MINOR: Missing Check Constraints** 🟡

**Current Schema:**
```typescript
// No check constraints for:
// - qty (should be non-zero? or allow zero?)
// - unitCost (should be non-negative)
// - runningQty (should be non-negative for most materials)
```

**Recommendation:** **Add check constraints for data integrity**

```typescript
// stockTransactionsTable
check('stock_txn_qty_nonzero_chk', sql`qty <> 0`),
check('stock_txn_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
check('stock_txn_total_cost_nonneg_chk', sql`total_cost >= 0`),
check('stock_txn_running_qty_nonneg_chk', sql`running_qty >= 0`),

// stockAdjustmentItemsTable
check('stock_adj_items_qty_diff_nonzero_chk', sql`qty_diff <> 0`),
check('stock_adj_items_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
```

**Considerations:**

| Constraint | Valid? | Reason |
|------------|--------|--------|
| `qty <> 0` | ✅ Maybe | Zero-quantity transactions are meaningless |
| `qty_diff <> 0` | ✅ Maybe | Zero-diff adjustments are no-ops |
| `unitCost >= 0` | ✅ Yes | Negative costs don't make sense |
| `runningQty >= 0` | ⚠️ Maybe | Negative stock = oversell (might be allowed temporarily?) |

**Recommendation:** **Add at minimum:**
- `unitCost >= 0` (always valid)
- `totalCost >= 0` (always valid)

**Impact:** ⭐⭐⭐ Data integrity

---

### **DESIGN: Precision Difference (Scale 4 vs Scale 6)** 🟢

**Current:**
```typescript
// inventory.ts uses scale 4 for quantities
qty: numeric({ precision: 18, scale: 4 })

// material.ts uses scale 6 for quantities
toBaseFactor: numeric({ precision: 18, scale: 6 })
currentQty: numeric({ precision: 18, scale: 6 })
```

**Question:** Should inventory match material's scale 6?

**Analysis:**

| Scale | Pros | Cons |
|-------|------|------|
| **Scale 4** | ✅ Sufficient for most use cases | ⚠️ Less precision than materials |
| **Scale 6** | ✅ Consistent with materials | ⚠️ Overkill for stock movements? |

**Recommendation:** **Change to scale 6 for consistency**

**Rationale:**
- Material conversions use scale 6
- Stock transactions derive from materials
- Prevents precision loss in UOM conversions
- Consistency trumps "sufficient precision"

**Impact:** ⭐⭐⭐⭐ Consistency with material.ts

---

### **DESIGN: Cost Precision (Scale 2)** 🟢

**Current:**
```typescript
unitCost: numeric({ precision: 18, scale: 2 })  // IDR precision
```

**Question:** Is scale 2 sufficient for cost calculations?

**Analysis:**

| Currency | Scale Needed | Example |
|----------|--------------|---------|
| IDR (Rupiah) | 0-2 | Rp 10,500.00 |
| USD | 2 | $10.50 |
| Crypto | 8+ | 0.00000123 BTC |

**Recommendation:** **Keep scale 2 for cost**

**Rationale:**
- IDR doesn't use sub-rupiah precision
- Standard accounting precision
- Matches financial reporting standards

**Impact:** N/A (no change needed)

---

### **MINOR: Documentation Missing** 🟡

**Current:**
- `stockBatchesTable` has minimal documentation
- `stockTransactionsTable` has good inline comments
- No table-level JSDoc like material.ts/product.ts

**Recommendation:** **Add comprehensive JSDoc for each table**

**Example:**
```typescript
/**
 * Stock Batches Table
 *
 * Batch/lot tracking for materials requiring expiry management or traceability.
 *
 * `batchNo`        — unique batch identifier within a material. Supplier lot number
 *                    or internal production batch. Unique per material.
 *
 * `expiryDate`     — when the batch expires. Used for FEFO (First Expired, First Out)
 *                    stock allocation. Null for non-perishable materials.
 *
 * `productionDate` — when the batch was produced/received. Used for aging analysis
 *                    and quality control. Null if unknown.
 *
 * onDelete: 'cascade' from material — batch data is owned by the material.
 * If material is deleted, all its batch records are removed.
 *
 * onDelete: 'set null' from transactions — historical transactions retain the
 * batchId reference, but if batch is deleted (e.g., data cleanup), transactions
 * remain valid without batch association.
 */
```

**Impact:** ⭐⭐⭐ Developer experience + maintainability

---

## 📝 Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Event Sourcing** | ⭐⭐⭐⭐⭐ | Perfect architecture |
| **Batch Tracking** | ⭐⭐⭐⭐⭐ | Enterprise-grade feature |
| **Movement Types** | ⭐⭐⭐⭐⭐ | Comprehensive coverage |
| **Running Totals** | ⭐⭐⭐⭐⭐ | Performance + audit |
| **Partial Indexes** | ⭐⭐⭐⭐ | **Use type-safe isNull()** |
| **Column Names** | ⭐⭐⭐ | **Add explicit names** |
| **Check Constraints** | ⭐⭐⭐ | **Add for cost fields** |
| **Precision** | ⭐⭐⭐⭐ | **Change qty to scale 6** |
| **Documentation** | ⭐⭐⭐ | **Add JSDoc comments** |
| **Overall** | ⭐⭐⭐⭐⭐ | Excellent (after fixes) |

---

## 🎯 Recommended Actions

### **Priority 1: Add Explicit Column Names** 🔴

**Action:** Add column name string to all field definitions

**Affected Tables:** ALL (5 tables need updates)

**Example:**
```typescript
// BEFORE:
materialId: integer()
  .notNull()
  .references(() => materialsTable.id, { onDelete: 'cascade' })

// AFTER:
materialId: integer('material_id')
  .notNull()
  .references(() => materialsTable.id, { onDelete: 'cascade' })
```

**Effort:** 10 minutes (many fields to update)  
**Impact:** ⭐⭐⭐⭐⭐ Consistency + explicitness

---

### **Priority 2: Use Type-Safe Partial Index** 🔴

**Action:** Replace `sql` template with `isNull()` operator

```typescript
import { isNull, sql } from 'drizzle-orm' // ✅ Add isNull import

// BEFORE:
.where(sql`${t.deletedAt} IS NULL`)

// AFTER:
.where(isNull(t.deletedAt))
```

**Effort:** 1 minute  
**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **Priority 3: Change Quantity Precision to Scale 6** 🟡

**Action:** Update all quantity fields from scale 4 to scale 6

```typescript
// BEFORE:
qty: numeric({ precision: 18, scale: 4 })

// AFTER:
qty: numeric({ precision: 18, scale: 6 })
```

**Affected Fields:**
- `stockAdjustmentItemsTable.qtyDiff`
- `stockTransactionsTable.qty`, `runningQty`
- `stockSummariesTable.*Qty` (all 12 quantity fields)

**Effort:** 5 minutes  
**Impact:** ⭐⭐⭐⭐ Consistency with material.ts

---

### **Priority 4: Add Check Constraints** 🟡

**Action:** Add constraints for cost fields

```typescript
// stockTransactionsTable
check('stock_txn_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
check('stock_txn_total_cost_nonneg_chk', sql`total_cost >= 0`),

// stockAdjustmentItemsTable
check('stock_adj_items_unit_cost_nonneg_chk', sql`unit_cost >= 0`),
```

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐ Data integrity

---

### **Priority 5: Add Documentation** 🟢

**Action:** Add comprehensive JSDoc for each table

**Effort:** 15 minutes  
**Impact:** ⭐⭐⭐ Developer experience

---

## 💡 Schema Best Practices Applied

✅ **Event Sourcing** - Complete audit trail via transactions  
✅ **Running Totals** - Performance optimization  
✅ **Batch Tracking** - Enterprise inventory feature  
✅ **Transfer Support** - Both sides linked  
✅ **Soft Delete** - Summaries can be recalculated  
⚠️ **Type Safety** - Use `isNull()` not `sql` for partial index  
⚠️ **Explicit Names** - Add column name strings  
⚠️ **Precision** - Match material.ts scale (6 for qty)  
⚠️ **Check Constraints** - Add for cost fields

---

## 🔍 Table-by-Table Analysis

### 1. stockBatchesTable ⭐⭐⭐⭐

**Purpose:** Batch/lot tracking with expiry dates

**Strengths:**
- ✅ Unique on (materialId, batchNo)
- ✅ Expiry date indexed for FEFO queries
- ✅ Full audit columns

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Add table-level JSDoc

**Example Data:**
```sql
INSERT INTO stock_batches (material_id, batch_no, expiry_date, production_date) VALUES
  (1, 'LOT-2024-001', '2025-12-31', '2024-01-15'),
  (1, 'LOT-2024-002', '2026-01-31', '2024-02-10');
```

---

### 2. stockAdjustmentsTable ⭐⭐⭐⭐⭐

**Purpose:** Stock opname/adjustment header

**Strengths:**
- ✅ Type enum (opname, waste, found, correction)
- ✅ Per-location scoping
- ✅ Reference number for traceability

**Improvements:**
- ⚠️ Add explicit column names

**Example Data:**
```sql
INSERT INTO stock_adjustments (location_id, type, adjustment_date, reason, reference_no) VALUES
  (1, 'opname', '2024-12-31', 'Monthly stock count', 'ADJ-2024-12-001');
```

---

### 3. stockAdjustmentItemsTable ⭐⭐⭐⭐

**Purpose:** Adjustment line items

**Strengths:**
- ✅ qtyDiff (positive/negative)
- ✅ unitCost snapshot
- ✅ Optional batch tracking

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Change qtyDiff to scale 6
- ⚠️ Add check constraint: unitCost >= 0

**Example Data:**
```sql
-- Found 5kg sugar (positive adjustment)
INSERT INTO stock_adjustment_items (adjustment_id, material_id, qty_diff, unit_cost) VALUES
  (1, 1, 5.0, 10500.00);

-- Lost 2kg flour (negative adjustment)
INSERT INTO stock_adjustment_items (adjustment_id, material_id, qty_diff, unit_cost) VALUES
  (1, 2, -2.0, 8500.00);
```

---

### 4. stockTransactionsTable ⭐⭐⭐⭐⭐

**Purpose:** Event log (all stock movements)

**Strengths:**
- ✅ Running totals (runningQty, runningAvgCost)
- ✅ Transfer support (counterpartLocationId, transferId)
- ✅ Batch support (batchId)
- ✅ Comprehensive indexes

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Change qty/runningQty to scale 6
- ⚠️ Add check constraints (unitCost >= 0, totalCost >= 0)

**Example Data:**
```sql
-- Purchase 100kg sugar @ 10,500/kg
INSERT INTO stock_transactions 
  (material_id, location_id, type, date, reference_no, qty, unit_cost, total_cost, running_qty, running_avg_cost)
VALUES
  (1, 1, 'purchase', '2024-01-15', 'PO-001', 100.0, 10500.00, 1050000.00, 100.0, 10500.00);

-- Transfer out 25kg to Bali
INSERT INTO stock_transactions 
  (material_id, location_id, type, date, reference_no, qty, unit_cost, total_cost, running_qty, running_avg_cost, counterpart_location_id, transfer_id)
VALUES
  (1, 1, 'transfer_out', '2024-01-20', 'TRF-001', -25.0, 10500.00, -262500.00, 75.0, 10500.00, 2, 1);
```

---

### 5. stockSummariesTable ⭐⭐⭐⭐⭐

**Purpose:** Daily snapshot/aggregation

**Strengths:**
- ✅ Opening/closing balances
- ✅ Movement breakdown by type
- ✅ Soft delete with partial unique index
- ✅ Unique per (material, location, date)

**Improvements:**
- ⚠️ Add explicit column names
- ⚠️ Use type-safe isNull() for partial index
- ⚠️ Change all *Qty fields to scale 6

**Example Data:**
```sql
-- Daily summary for sugar at Jakarta on 2024-01-15
INSERT INTO stock_summaries 
  (material_id, location_id, date, opening_qty, purchase_qty, closing_qty, opening_avg_cost, closing_avg_cost)
VALUES
  (1, 1, '2024-01-15', 0.0, 100.0, 100.0, 0.0, 10500.00);
```

---

## 🎯 Design Patterns Highlighted

### Pattern 1: Event Sourcing + Projection ⭐⭐⭐⭐⭐

**Event Log (Source of Truth):**
```typescript
stockTransactionsTable: {
  // Every stock movement recorded immutably
  materialId, locationId, type, qty, unitCost
}
```

**Projection (Query Optimization):**
```typescript
stockSummariesTable: {
  // Daily aggregation for fast reporting
  materialId, locationId, date
  openingQty, movements..., closingQty
}
```

**Benefits:**
- ✅ Complete audit trail
- ✅ Can rebuild projection from events
- ✅ Fast queries on aggregated data

---

### Pattern 2: Running Totals ⭐⭐⭐⭐⭐

**In Event Log:**
```typescript
stockTransactionsTable: {
  qty: 10,               // This transaction
  runningQty: 110,       // After this transaction
  runningAvgCost: 10500  // After this transaction
}
```

**Query Current Stock:**
```sql
-- Fast: Just get the latest transaction
SELECT running_qty, running_avg_cost
FROM stock_transactions
WHERE material_id = 1 AND location_id = 1
ORDER BY date DESC, id DESC
LIMIT 1;

-- Slow alternative: Sum all transactions
SELECT SUM(qty) as current_qty
FROM stock_transactions
WHERE material_id = 1 AND location_id = 1;
```

---

### Pattern 3: Transfer Linking ⭐⭐⭐⭐⭐

**Both Sides Recorded:**
```sql
-- Location A: Transfer OUT
INSERT INTO stock_transactions 
  (location_id, type, qty, counterpart_location_id, transfer_id)
VALUES (1, 'transfer_out', -25, 2, 123);

-- Location B: Transfer IN
INSERT INTO stock_transactions 
  (location_id, type, qty, counterpart_location_id, transfer_id)
VALUES (2, 'transfer_in', 25, 1, 123);
```

**Reconciliation Query:**
```sql
-- Find unmatched transfers
SELECT transfer_id, COUNT(*) as sides
FROM stock_transactions
WHERE type IN ('transfer_in', 'transfer_out')
GROUP BY transfer_id
HAVING COUNT(*) <> 2;
```

---

## 🔗 Cross-Schema Dependencies

**Depends On:**
- ✅ `materialsTable` - What is being moved
- ✅ `locationsTable` - Where movements occur
- ✅ `transactionTypeEnum`, `stockAdjustmentTypeEnum` (from `_enums.ts`)

**Used By:**
- Purchasing module (receive goods → purchase transaction)
- Production module (consume materials → usage transaction)
- Sales module (sell products → sell transaction)
- Warehouse module (transfers, adjustments)

---

## 🧪 Example Queries

### Query 1: Current Stock by Location
```sql
SELECT 
  m.sku,
  m.name,
  st.running_qty as current_qty,
  st.running_avg_cost,
  st.running_qty * st.running_avg_cost as current_value
FROM (
  SELECT DISTINCT ON (material_id, location_id)
    material_id, location_id, running_qty, running_avg_cost
  FROM stock_transactions
  WHERE location_id = 1
  ORDER BY material_id, location_id, date DESC, id DESC
) st
JOIN materials m ON st.material_id = m.id
WHERE st.running_qty > 0
ORDER BY m.sku;
```

---

### Query 2: Movement Report (Daily)
```sql
SELECT 
  m.sku,
  m.name,
  ss.opening_qty,
  ss.purchase_qty,
  ss.transfer_in_qty,
  ss.transfer_out_qty,
  ss.adjustment_qty,
  ss.usage_qty,
  ss.closing_qty
FROM stock_summaries ss
JOIN materials m ON ss.material_id = m.id
WHERE ss.location_id = 1
  AND ss.date = '2024-01-15'
ORDER BY m.sku;
```

---

### Query 3: Expiring Batches
```sql
SELECT 
  m.sku,
  m.name,
  sb.batch_no,
  sb.expiry_date,
  st.running_qty as qty_on_hand
FROM stock_batches sb
JOIN materials m ON sb.material_id = m.id
LEFT JOIN LATERAL (
  SELECT running_qty
  FROM stock_transactions
  WHERE material_id = sb.material_id
    AND batch_id = sb.id
  ORDER BY date DESC, id DESC
  LIMIT 1
) st ON TRUE
WHERE sb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND st.running_qty > 0
ORDER BY sb.expiry_date;
```

---

## 📊 Numeric Precision Analysis

**Current:**
| Field Type | Precision | Scale | Example |
|------------|-----------|-------|---------|
| Quantity | 18 | **4** | 1234.5678 |
| Cost | 18 | 2 | 10500.50 |

**Material.ts:**
| Field Type | Precision | Scale | Example |
|------------|-----------|-------|---------|
| Quantity | 18 | **6** | 1234.567890 |
| Cost | 18 | 6 | 10500.500000 |

**Recommendation:** **Change quantity scale to 6 for consistency**

---

**Status:** ✅ Schema is excellent, five improvements recommended  
**Next:** Apply fixes (explicit column names, type-safe index, precision, check constraints)

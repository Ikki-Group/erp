# Schema Review: purchasing.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The purchasing.ts file contains **8 tables**:

1. `purchaseRequestsTable` - Purchase request header (PR)
2. `purchaseRequestItemsTable` - PR line items
3. `purchaseOrdersTable` - Purchase order header (PO)
4. `purchaseOrderItemsTable` - PO line items
5. `goodsReceiptNotesTable` - Goods receipt header (GRN)
6. `goodsReceiptNoteItemsTable` - GRN line items
7. `purchaseInvoicesTable` - Purchase invoice header
8. `purchaseInvoiceItemsTable` - Invoice line items

---

## ✅ Strengths

### 1. **Complete Procurement Flow** ⭐⭐⭐⭐⭐

**PR → PO → GRN → Invoice:**

```
Purchase Request (need to buy)
    ↓
Purchase Order (committed to buy)
    ↓
Goods Receipt Note (received goods)
    ↓
Purchase Invoice (bill from supplier)
```

✅ **Excellent:** Complete procurement cycle

---

### 2. **Immutable History Pattern** ⭐⭐⭐⭐⭐

```typescript
purchaseOrderItemsTable: {
  materialId: integer().references(..., { onDelete: 'set null' }),
  itemName: text().notNull()  // ✅ Always preserved
}
```

✅ **Perfect:** Same pattern as sales (history never breaks)

---

### 3. **Proper Linking Between Documents** ⭐⭐⭐⭐⭐

```typescript
// PR → PO link
purchaseOrdersTable: {
	requestId: integer().references(() => purchaseRequestsTable.id)
}

// PO → GRN link
goodsReceiptNotesTable: {
	orderId: integer().references(() => purchaseOrdersTable.id)
}
```

✅ **Excellent:** Traceability throughout procurement

---

### 4. **Financial Lock Pattern** ⭐⭐⭐⭐⭐

```typescript
purchaseOrderItemsTable: {
	// Financial lock (Price Lock)
	;(unitPrice, discountAmount, taxAmount, subtotal)
}
```

✅ **Perfect:** Prices locked at PO time (protect against supplier price changes)

---

## ⚠️ Issues & Improvements

### **CRITICAL: Missing Explicit Column Names** 🔴

**Current (ALL tables affected):**

```typescript
// ❌ Missing column names
locationId: integer()
	.notNull()
	.references(() => locationsTable.id, { onDelete: 'restrict' })

requestedBy: integer().notNull()
status: purchaseRequestStatusEnum().notNull().default('open')
notes: text()
```

**Should Have:**

```typescript
// ✅ Explicit column names
locationId: integer('location_id')
	.notNull()
	.references(() => locationsTable.id, { onDelete: 'restrict' })

requestedBy: integer('requested_by').notNull()
status: purchaseRequestStatusEnum('status').notNull().default('open')
notes: text('notes')
```

**Impact:** ⭐⭐⭐⭐⭐ Consistency with all other schemas

---

### **MINOR: Quantity Precision (Scale 4 vs 6)** 🟡

**Current:**

```typescript
// purchasing.ts uses scale 4
quantity: numeric({ precision: 18, scale: 4 })

// inventory.ts uses scale 6 (after review)
qty: numeric('qty', { precision: 18, scale: 6 })
```

**Recommendation:** **Change to scale 6 for consistency**

**Affected Fields:**

- `purchaseRequestItemsTable.quantity`
- `purchaseOrderItemsTable.quantity`
- `goodsReceiptNoteItemsTable.quantityReceived`
- `purchaseInvoiceItemsTable.quantity`

**Impact:** ⭐⭐⭐⭐ Consistency with inventory.ts

---

### **MINOR: Missing Check Constraints** 🟡

**Current:**

```typescript
// No check constraints for:
// - totalAmount, discountAmount, taxAmount (should be >= 0)
// - quantity (should be > 0)
// - unitPrice (should be >= 0)
```

**Recommendation:** **Add check constraints for data integrity**

```typescript
// purchaseOrdersTable
check('purchase_orders_total_nonneg_chk', sql`total_amount >= 0`)
check('purchase_orders_discount_nonneg_chk', sql`discount_amount >= 0`)
check('purchase_orders_tax_nonneg_chk', sql`tax_amount >= 0`)

// purchaseOrderItemsTable
check('purchase_order_items_qty_pos_chk', sql`quantity > 0`)
check('purchase_order_items_unit_price_nonneg_chk', sql`unit_price >= 0`)

// Similar for invoices...
```

**Impact:** ⭐⭐⭐ Data integrity

---

## 📝 Summary

| Category              | Rating     | Notes                      |
| --------------------- | ---------- | -------------------------- |
| **Procurement Flow**  | ⭐⭐⭐⭐⭐ | Complete PR→PO→GRN→Invoice |
| **Immutable History** | ⭐⭐⭐⭐⭐ | Item names preserved       |
| **Document Linking**  | ⭐⭐⭐⭐⭐ | Traceability complete      |
| **Financial Lock**    | ⭐⭐⭐⭐⭐ | Prices locked at PO        |
| **Column Names**      | ⭐⭐⭐     | **Add explicit names**     |
| **Precision**         | ⭐⭐⭐⭐   | **Change qty to scale 6**  |
| **Check Constraints** | ⭐⭐⭐     | **Add for amounts**        |
| **Overall**           | ⭐⭐⭐⭐⭐ | Excellent (after fixes)    |

---

## 🎯 Recommended Actions

### **Priority 1: Add Explicit Column Names** 🔴

**Action:** Add column name string to all field definitions

**Affected Tables:** ALL (8 tables need updates)

**Effort:** 15 minutes  
**Impact:** ⭐⭐⭐⭐⭐ Consistency

---

### **Priority 2: Change Quantity Precision to Scale 6** 🟡

**Action:** Update quantity fields from scale 4 to scale 6

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐⭐ Consistency with inventory.ts

---

### **Priority 3: Add Check Constraints** 🟡

**Action:** Add constraints for amount/quantity fields

**Effort:** 7 minutes  
**Impact:** ⭐⭐⭐ Data integrity

---

## 💡 Schema Best Practices Applied

✅ **Complete Procurement Cycle** - PR→PO→GRN→Invoice  
✅ **Immutable History** - Item names stored  
✅ **Document Linking** - Traceability  
✅ **Financial Lock** - Prices locked  
⚠️ **Explicit Names** - Add column name strings  
⚠️ **Precision** - Match inventory.ts scale (6 for qty)  
⚠️ **Check Constraints** - Add for amounts

---

**Status:** ✅ Schema is excellent, three improvements recommended  
**Next:** Apply fixes (explicit column names, precision, check constraints)

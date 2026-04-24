# B2B Sales & Distribution

**Layer**: 2 (Operations - Depends on Product, Material, Location, Inventory, Recipe, IAM)  
**Status**: MVP - B2B order pipeline  
**Complexity**: High (order fulfillment, inventory allocation, COGS recognition, AR tracking)

---

## 1. Overview

B2B Sales & Distribution manages wholesale operations (selling in bulk to partner cafes, franchises, retailers). Unlike B2C (customers via POS), B2B involves:
- Large quantities at discounted rates
- Credit terms (customer pays later, not upfront)
- Reserved inventory (allocated to order before fulfillment)
- Formal invoicing and Accounts Receivable tracking
- COGS recognition on shipment (not on order)

---

## 2. Core Objectives

- **Order Lifecycle Management**: Track quotation → order → delivery → invoice → payment
- **Inventory Allocation**: Reserve stock for B2B orders so retail outlets cannot use it
- **Credit Terms**: Support Net 30/60 payment terms, track overdue invoices
- **COGS Recognition**: Record cost of goods sold only when delivered (accrual accounting)
- **Revenue Tracking**: Formal invoices for accounting and audit trail

---

## 3. Key Entities & Relationships

```
Customer (B2B Partner)
├─ id: 1
├─ name: "Partner Cafe A"
├─ contact_person: "Budi"
├─ phone: "081234567890"
├─ email: "partner@cafe.com"
├─ address: "Jl. Sudirman, Jakarta"
├─ payment_terms: "Net 30" (or Net 60, prepaid, COD)
├─ discount_tier: 15% (wholesale VIP)
├─ credit_limit: 50,000,000 (Rp)
├─ is_active: true
└─ created_by: FK → User

SalesQuotation (SQ - Draft)
├─ id: "SQ-001"
├─ customer_id: FK → Customer
├─ status: "draft" | "sent" | "accepted" | "rejected"
├─ valid_until: 2026-04-30 (30-day validity)
├─ total_amount: 0 (sum of lines)
├─ notes: "Wholesale pricing"
└─ created_at: 2026-04-24T10:00:00Z

QuotationLineItem
├─ quotation_id: FK → SalesQuotation
├─ product_id: FK → Product
├─ material_id: FK → Material (can also sell raw materials)
├─ quantity: 50 (kg, liters, units)
├─ unit_price: 4.25 (discounted from $5.00)
├─ total_price: 212.50
└─ notes: "Bulk discount applied"

SalesOrder (SO - Confirmed, Stock Reserved)
├─ id: "SO-001"
├─ customer_id: FK → Customer
├─ quotation_id: FK → SalesQuotation (optional)
├─ status: "confirmed" | "partially_shipped" | "shipped" | "cancelled"
├─ total_amount: 212.50
├─ stock_reserved: true
├─ reserved_until: 2026-05-02 (2 weeks hold, then auto-release)
├─ created_by: FK → User
├─ created_at: 2026-04-24T14:00:00Z
└─ shipped_at: NULL (until delivery)

SalesOrderLineItem
├─ order_id: FK → SalesOrder
├─ product_id: FK → Product
├─ quantity: 50
├─ unit_price: 4.25
├─ total_price: 212.50
├─ quantity_shipped: 0 (until DO confirmed)
├─ cogs_per_unit: 1.50 (recipe cost + allocation overhead)
└─ cogs_total: 0 (until shipped)

DeliveryOrder (DO - Pick List)
├─ id: "DO-001"
├─ sales_order_id: FK → SalesOrder
├─ status: "draft" | "picked" | "in_transit" | "delivered" | "cancelled"
├─ delivery_date: 2026-04-26
├─ driver_name: "Adi"
├─ vehicle: "CX-1234"
├─ signed_by_customer: "Budi" (customer signature)
├─ signed_at: 2026-04-26T15:00:00Z
└─ created_at: 2026-04-24T14:30:00Z

SalesInvoice (Faktur - After Delivery)
├─ id: "INV-001"
├─ sales_order_id: FK → SalesOrder
├─ delivery_order_id: FK → DeliveryOrder
├─ customer_id: FK → Customer
├─ invoice_date: 2026-04-26
├─ due_date: 2026-05-26 (Net 30)
├─ total_amount: 212.50
├─ status: "issued" | "paid" | "overdue" | "cancelled"
├─ paid_amount: 0
├─ payment_date: NULL
└─ notes: "Payment via transfer to account..."

Relationships:
- SalesOrder → Location (warehouse sells to customer location)
- SalesOrderLineItem → Inventory (deducted on shipment)
- SalesInvoice → AR (Accounts Receivable for overdue tracking)
```

---

## 4. Use Cases & Workflows

### UC-001: Create Sales Quotation (Customer inquires for bulk order)

**Actors**: Sales Manager, Admin  
**Precondition**: Customer exists, products priced

**Steps**:
1. Partner Cafe calls: "Can you provide 50kg roasted beans monthly?"
2. Sales Manager creates Quotation:
   - Customer: "Partner Cafe A"
   - Lines:
     * Roasted Beans: 50kg @ $4.25/kg (15% wholesale discount from $5.00)
   - Total: $212.50
   - Valid until: 2026-04-30
3. System generates unique SQ-001
4. Sales Manager emails quotation to customer
5. Status: "sent"
6. Customer has 7 days to accept/reject

**Business Rules**:
- Quotation doesn't reserve stock (draft only)
- Discount applied based on customer tier
- Valid until date enforced (quote expires auto)
- Can be converted to Sales Order if accepted

---

### UC-002: Create Sales Order (Customer confirms quotation)

**Actors**: Sales Manager, Customer  
**Precondition**: Quotation sent, customer agreed

**Steps**:
1. Customer: "Terima, kirim SQ-001 ke SO"
2. Sales Manager creates Sales Order from Quotation:
   - Copies all lines from SQ-001
   - Status: "confirmed"
3. System **reserves stock** immediately:
   - Roasted Beans: 50kg reserved at Warehouse
   - Cannot be transferred to outlets
   - Reservation holds for 14 days (configurable)
4. System creates StockMovement (type: "reserved"):
   - From: Warehouse (Gudang Utama)
   - Material: Roasted Beans
   - Quantity: 50kg
   - Status: "reserved" (not yet deducted)
5. Warehouse Manager sees order in dashboard: "50kg beans allocated to SO-001"
6. Sales Manager notifies customer: "Order confirmed, delivery scheduled 2026-04-26"

**Business Rules**:
- Stock reserved at SO creation (hard allocation)
- Cannot convert to delivery if insufficient stock
- Reservation auto-releases if not shipped within 14 days
- Multiple SOs can reserve from same warehouse stock (first-come-first-served)

---

### UC-003: Create Delivery Order & Ship (Fulfillment)

**Actors**: Warehouse Manager, Driver  
**Precondition**: Sales Order confirmed, stock reserved, delivery date reached

**Steps**:
1. Warehouse Manager: "Time to ship SO-001"
2. Creates Delivery Order from Sales Order:
   - Lists all items (pick list): 50kg Roasted Beans
   - Scheduled delivery: 2026-04-26
3. Warehouse staff:
   - Picks items from warehouse
   - Scans QR codes to verify
   - Loads into vehicle
4. Driver takes DO printout + goods
5. Upon arrival at customer site:
   - Customer (Budi) verifies items received: "50kg beans, condition OK"
   - Customer signs delivery order
6. System processes shipment:
   ```
   Status: "delivered"
   ↓
   Create StockMovement (type: "deduction"):
     - From: Warehouse
     - To: NULL (customer external)
     - Quantity: 50kg
   ↓
   Create StockLedger:
     - Warehouse Beans: -50kg
     - COGS: 50kg × $1.50 = $75.00
   ↓
   Update SalesOrderLineItem:
     - quantity_shipped: 50kg
     - cogs_total: $75.00
   ↓
   Status: "shipped"
   ```
7. Warehouse stock updated immediately (visible in dashboard)
8. System generates Invoice

**Business Rules**:
- DO is pick list, cannot deviate from SO
- Can only ship reserved quantity
- Signature required (physical or digital)
- Shipment triggers inventory deduction
- COGS recognized on shipment (accrual accounting)

---

### UC-004: Create Invoice & Track Payment (AR Management)

**Actors**: Admin, Finance  
**Precondition**: Delivery Order signed

**Steps**:
1. System auto-generates Invoice after DO shipped:
   - Invoice ID: "INV-001"
   - Customer: Partner Cafe A
   - Amount: $212.50
   - Terms: Net 30 (due 2026-05-26)
   - Status: "issued"
2. Invoice emailed to customer with payment details
3. Finance Dashboard shows:
   - Total AR (outstanding): $212.50
   - Aging: 0-30 days
4. Customer makes payment on 2026-05-20:
   - Finance staff records: Payment received $212.50
   - Updates Invoice.paid_amount = $212.50
   - Status: "paid"
5. If no payment by 2026-05-27:
   - Status auto-changes to "overdue"
   - System alerts Finance: "Send payment reminder to Partner Cafe A"
6. After 45 days overdue:
   - Escalation: Finance director notified
   - Optional: Sales Manager can call customer

**Business Rules**:
- Invoice created only after DO delivered
- Due date calculated from invoice_date + payment_terms
- Automatic overdue tracking
- AR aging report generated weekly
- Payment must match invoice amount (no partial payments in MVP)

---

## 5. Data Model

### Customer Table

```sql
CREATE TABLE b2b_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  payment_terms VARCHAR(50) DEFAULT 'Net 30', -- Net 30/60, COD, Prepaid
  discount_tier DECIMAL(5, 2) DEFAULT 0, -- Percentage discount
  credit_limit DECIMAL(15, 2), -- Max outstanding AR
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
)

CREATE INDEX idx_b2b_customers_name ON b2b_customers(name);
```

### SalesOrder Table

```sql
CREATE TABLE sales_orders (
  id VARCHAR(50) PRIMARY KEY, -- "SO-001"
  customer_id INTEGER NOT NULL REFERENCES b2b_customers(id),
  quotation_id VARCHAR(50) REFERENCES sales_quotations(id),
  status VARCHAR(20) CHECK (status IN ('confirmed', 'partially_shipped', 'shipped', 'cancelled')),
  total_amount DECIMAL(15, 2),
  stock_reserved BOOLEAN DEFAULT true,
  reserved_until TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  shipped_at TIMESTAMP,
  CONSTRAINT valid_total CHECK (total_amount >= 0)
)

CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
```

### SalesOrderLineItem Table

```sql
CREATE TABLE sales_order_line_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  material_id INTEGER REFERENCES materials(id),
  quantity DECIMAL(12, 4) NOT NULL,
  unit_price DECIMAL(10, 4) NOT NULL,
  total_price DECIMAL(15, 2),
  quantity_shipped DECIMAL(12, 4) DEFAULT 0,
  cogs_per_unit DECIMAL(10, 4),
  cogs_total DECIMAL(15, 2),
  notes TEXT,
  CONSTRAINT product_or_material CHECK (
    (product_id IS NOT NULL AND material_id IS NULL) OR
    (product_id IS NULL AND material_id IS NOT NULL)
  )
)

CREATE INDEX idx_sales_order_line_items_order ON sales_order_line_items(order_id);
```

### SalesInvoice Table

```sql
CREATE TABLE sales_invoices (
  id VARCHAR(50) PRIMARY KEY, -- "INV-001"
  sales_order_id VARCHAR(50) NOT NULL REFERENCES sales_orders(id),
  customer_id INTEGER NOT NULL REFERENCES b2b_customers(id),
  invoice_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('issued', 'paid', 'overdue', 'cancelled')),
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  payment_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
)

CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_due_date ON sales_invoices(due_date);
```

---

## 6. Business Rules & Validations

**Order Rules**:
- Sales Order references existing Quotation (optional)
- Status transitions: confirmed → shipped → (optional: partially_shipped)
- Cannot ship more than ordered quantity
- Stock must be available at warehouse

**Inventory Rules**:
- Stock reserved at SO creation (hard allocation)
- Cannot be released manually (only by SO cancellation or reservation expiry)
- First-come-first-served for warehouse stock
- If insufficient, SO cannot proceed (must create backorder)

**Invoice Rules**:
- Created automatically after delivery
- Due date = invoice_date + payment_terms
- Cannot be modified after issued (create credit memo instead)
- Overdue status triggered automatically (scheduled job)

**Payment Rules**:
- Exact match required (no over/under payment in MVP)
- Cash discounts not supported in MVP (Phase 2)
- No partial payments (full amount or nothing)

---

## 7. API Endpoints & Routes

### POST `/b2b/quotations/create`
**Body**:
```typescript
{
  customer_id: 1,
  valid_until: "2026-04-30",
  lines: [
    { product_id: 1, quantity: 50, unit_price: 4.25 }
  ]
}
```
**Response**: 201 Created with SQ-001

### POST `/b2b/sales-orders/create`
**Body**:
```typescript
{
  quotation_id: "SQ-001"
}
```
**Response**: 201 Created with SO-001 (auto-reserves stock)

### POST `/b2b/delivery-orders/create`
**Body**:
```typescript
{
  sales_order_id: "SO-001",
  delivery_date: "2026-04-26",
  driver_name: "Adi"
}
```
**Response**: 201 Created with DO-001

### PUT `/b2b/delivery-orders/:id/confirm-delivery`
**Body**:
```typescript
{
  signed_by_customer: "Budi",
  condition: "good"
}
```
**Response**: 200 OK (triggers inventory deduction & invoice creation)

### GET `/b2b/accounts-receivable`
**Response**: AR aging report (0-30 days, 30-60, 60+)

---

## 8. Integration Points

### Upstream Dependencies:
- **Product** (Layer 0): Products sold in orders
- **Material** (Layer 1): Raw materials can be sold B2B
- **Inventory** (Layer 2): Stock reservation and deduction
- **Recipe** (Layer 2): COGS calculation

### Downstream Dependencies:
- **Finance** (Phase 2): AR, invoice payment tracking

---

## 9. Implementation Notes

### Stock Allocation Pattern
```typescript
// At SO creation:
const availableStock = warehouse_balance - reserved_quantity
if (ordered_quantity > availableStock) {
  throw ConflictError('Insufficient stock for order')
}

// Mark as reserved (not deducted yet)
await reserveStock(material_id, warehouse_id, quantity, SO_id)

// At DO confirmation:
// Deduct from inventory (create StockMovement + StockLedger)
// Update SO_status to "shipped"
```

---

## 10. Future Enhancements (Phase 2+)

- **Backorders**: Queue orders when stock unavailable
- **Partial Shipments**: Split delivery across multiple DOs
- **Credit Memos**: Handle returns and debit notes
- **Payment Reminders**: Automated WhatsApp/Email reminders
- **RMA (Return Merchandise Authorization)**: Track product returns
- **Tiered Pricing**: Volume-based pricing brackets

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Product (Layer 0), Material (Layer 1), Inventory (Layer 2), Recipe (Layer 2), IAM (Layer 1)  
**Estimated Implementation**: 12-15 hours

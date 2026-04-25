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

## 3. Use Cases & Workflows

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

## 4. Recommended Enhancements (Phase 2+)

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

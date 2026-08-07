# PRD: Point of Sale (POS)

Specifications for the built-in POS — orders, table management, open/close bill, split bill, payments, void, and multi-source import.

## Overview

POS is available only at `store`-type locations. Supports two billing modes:

- **Open bill (tab):** Order first, pay later. Multiple orders can be added before closing.
- **Close bill (counter):** Order and pay immediately.

Both modes produce the same `Order` records — the difference is when payment is collected.

## Order

### Purpose

A customer's order at a location. Can be linked to a table (dine-in) or standalone (takeaway/counter).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| orderNo | string | Auto-generated order number |
| locationId | FK | Which store |
| tableId | FK? | Linked table (null for takeaway/counter) |
| shiftId | FK | Cashier shift this order belongs to |
| type | enum | `dine_in`, `takeaway` |
| billingMode | enum | `open`, `closed` |
| status | enum | `open`, `completed`, `voided` |
| subtotal | decimal | Sum of line totals |
| discountAmount | decimal | Order-level discount |
| taxAmount | decimal | Tax |
| total | decimal | Final amount |
| customerId | FK? | Linked customer (for loyalty) |
| source | enum | `internal`, `moka`, `manual` |
| externalRef | string? | External system reference (dedup) |
| notes | string? | Order notes |
| orderedAt | timestamp | When first created |
| completedAt | timestamp? | When payment finalized |

### Order Line

| Field | Type | Description |
|-------|------|-------------|
| orderId | FK | Parent order |
| menuItemId | FK | Menu item ordered |
| menuItemName | string | Snapshot of item name |
| quantity | decimal | Qty ordered |
| unitPrice | decimal | Base price at time of order |
| modifiers | jsonb | Selected modifiers with price adjustments |
| modifierTotal | decimal | Sum of modifier price adjustments |
| discountAmount | decimal | Line-level discount |
| lineTotal | decimal | (qty × (unitPrice + modifierTotal)) - discount |
| status | enum | `active`, `voided` |
| notes | string? | Special instructions |
| voidedBy | FK? | Who voided this line |
| voidedAt | timestamp? | When voided |

### Order Line Modifier (stored in jsonb)

```json
[
  { "groupName": "Size", "optionName": "Large", "priceAdjustment": 5000 },
  { "groupName": "Sugar", "optionName": "Less", "priceAdjustment": 0 }
]
```

### Business Rules

- Orders belong to exactly one location.
- `orderNo` is unique per location (resets or prefixed per location).
- Open bill: status stays `open` until payment. New lines can be added.
- Close bill: payment happens immediately, status goes to `completed`.
- Stock auto-deduct happens on `completed` (via recipe).
- Journal entry auto-generated on `completed`.

## Table Management

### Purpose

Track dine-in tables/seats at store locations.

### Table Fields

| Field | Type | Description |
|-------|------|-------------|
| locationId | FK | Which store |
| number | string | Table identifier ("1", "2", "A1", "Outdoor-3") |
| capacity | integer? | Seats |
| status | enum | `available`, `occupied`, `reserved` |
| isActive | boolean | Table exists/removed |

### Business Rules

- Table numbers are unique within a location.
- Status changes automatically: `available` → `occupied` (when order linked), `occupied` → `available` (when order completed/voided).
- **Move table:** reassign order from table A to table B. Old table becomes available.
- **Merge table:** combine orders from two tables into one (one bill for both).

## Billing Modes

### Open Bill (Tab)

```
Customer sits at table → Waiter creates order (status: open, billingMode: open)
  → Add items (line by line, can be multiple rounds)
  → Customer requests bill
  → Cashier closes bill (record payment, status: completed)
```

- Lines can be added to an open order over time.
- Customer pays at the end of their visit.
- One table = one open order at a time.

### Close Bill (Counter)

```
Customer orders at counter → Cashier creates order + adds items
  → Customer pays immediately
  → Order completed in one action (billingMode: closed)
```

- Order is created and paid in a single flow.
- Common at cafes / takeaway.

## Split Bill

### Purpose

Divide one order's payment into multiple transactions.

### How It Works

One order can have multiple payment records. Split is handled at the **payment level**, not the order level.

```
Order #123: Rp 150.000
├── Payment 1: Rp 75.000 (Cash - Person A)
├── Payment 2: Rp 50.000 (QRIS - Person B)
└── Payment 3: Rp 25.000 (Cash - Person C)
    Total paid: Rp 150.000 ✓ → order completed
```

Alternative: split by items (Person A pays items 1-3, Person B pays items 4-5). This is handled by the cashier selecting which lines belong to which payment.

### Business Rules

- Order is `completed` only when total payments ≥ order total.
- Each payment record tracks who paid how much with which method.
- Split bill is just multiple payment records on one order.

## Payment

### Payment Method

| Field | Type | Description |
|-------|------|-------------|
| code | string | Unique (CASH, QRIS, DEBIT, CREDIT, GOPAY, OVO, etc.) |
| name | string | Display name |
| type | enum | `cash`, `digital` |
| isActive | boolean | Available for use |

Payment methods are **configurable per location** — each store can enable/disable different methods.

### Payment Method Assignment

| Field | Type | Description |
|-------|------|-------------|
| paymentMethodId | FK | Method |
| locationId | FK | Location |
| isEnabled | boolean | Active at this location |

### Payment Record

| Field | Type | Description |
|-------|------|-------------|
| orderId | FK | Linked order |
| paymentMethodId | FK | How they paid |
| amount | decimal | Amount paid |
| reference | string? | Approval code, transfer ref |

### Business Rules

- A location only shows payment methods that are enabled for it.
- A single order can have multiple payments (split payment / mixed method).
- Cash payments: system calculates change (amount tendered - amount due).
- Order completes when sum(payments) ≥ order total.

## Cashier Shift

### Fields

| Field | Type | Description |
|-------|------|-------------|
| locationId | FK | Store |
| userId | FK | Cashier |
| status | enum | `open`, `closed` |
| openedAt | timestamp | Shift start |
| closedAt | timestamp? | Shift end |
| openingCash | decimal | Cash in drawer at open |
| closingCash | decimal? | Actual cash at close |
| expectedCash | decimal? | System-calculated expected |
| notes | string? | Shift notes |

### Business Rules

- One open shift per cashier per location at a time.
- All orders during a shift are linked to that shift.
- On close: `expectedCash` = openingCash + cash_payments - cash_refunds.
- Variance (closingCash - expectedCash) recorded for accountability.

## Void

### Full Void (entire order)

- Sets order status to `voided`.
- Reverses stock deductions (restores materials).
- Creates reversing journal entry.
- No time limit (configurable in future if needed).
- Currently: any user can void. Future: restrict by role.
- Audit trail captures who voided and when.

### Partial Void (single line)

- Sets line status to `voided`.
- Recalculates order totals (subtotal, tax, total).
- Reverses stock deduction for that line only.
- If order was already paid: creates adjustment (refund or credit).

### Business Rules

- Voided orders/lines are preserved (never deleted).
- Void creates audit trail entry.
- Stock restoration only happens if stock was already deducted (i.e. order was `completed`).
- Voiding an open order (not yet paid) does not affect stock or finance.

## Moka Import

### Purpose

Import historical and ongoing transactions from Moka POS.

### What Gets Imported

- Sales transactions (with line items)
- Master data (items → mapped to menu items + modifiers)

### Import Flow

```
Moka data (API / CSV)
  → Map Moka items → our menu items + modifiers
  → Normalize to Order format (source: 'moka')
  → Deduplicate by externalRef
  → Create orders (status: completed)
  → Optionally trigger stock deduction
  → Auto-generate journal entries
```

### Business Rules

- Import is idempotent (same data → no duplicates via `externalRef`).
- Unmapped items are flagged for manual resolution.
- Historical imports can skip stock deduction (configurable).
- Import creates audit log with counts (imported, skipped, errors).

## Discount

### Types

| Type | Scope | Example |
|------|-------|---------|
| Percentage | Line or Order | 10% off item |
| Fixed amount | Line or Order | Rp 5.000 off |
| Voucher code | Order | Promo code "WEEKEND20" |

### Business Rules

- Line-level discounts and order-level discounts can coexist.
- One voucher code per order max.
- Discount cannot exceed line/order total (no negative totals).

---

**Next:** [06-prd-inventory.md](./06-prd-inventory.md) — Inventory module.

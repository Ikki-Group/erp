# Workflows

Key business workflows and state machines spanning multiple modules.

## POS Order Flow

### Open Bill (Tab / Dine-in)

```
Waiter creates order → links to table (status: open)
  → Add line items (multiple rounds)
  → Customer requests bill
  → Cashier records payment(s) (split if needed)
  → Sum(payments) ≥ total → status: completed
  → Auto: recipe deducts stock from location
  → Auto: journal entry (Kas → Pendapatan, HPP → Persediaan)
  → Auto: loyalty points earned (if customer linked)
  → Table status → available
```

### Close Bill (Counter / Takeaway)

```
Cashier creates order (no table)
  → Add all items at once
  → Record payment immediately
  → Status: completed (single action)
  → Same auto-triggers as open bill
```

## Transfer Request Flow

```
Store manager creates transfer request
  (toLocation: their store, fromLocation: warehouse)
       ↓
Status: requested
       ↓
Warehouse staff views pending requests
  → Confirms shipment (sets shippedQty per line)
  → Stock deducted from source location
  → Status: in_transit
       ↓
Store staff confirms receipt
  → Stock added to destination location
  → Status: received
```

## Receiving (Purchase) Flow

```
Goods arrive at location (warehouse or store)
       ↓
Staff creates receiving record
  (supplier, items, quantities in purchase UoM, unit cost)
       ↓
System:
  1. Converts purchase UoM → storage UoM
  2. Creates stock movement (purchase_receipt, in)
  3. Updates stock balance
  4. Recalculates material weighted average cost
  5. Creates journal: debit Persediaan, credit Hutang Usaha (or Kas)
  6. Creates AP record (if credit purchase)
```

## Payroll Flow

```
Month end → HR creates payroll run (status: draft)
       ↓
System calculates per employee:
  attendance, absences, lates, overtime
  → netSalary computed (status: calculated)
       ↓
Manager/owner adjusts if needed (bonus, deductions)
       ↓
Owner approves (status: approved, amounts frozen)
       ↓
Mark as paid (status: paid)
  → Journal: debit Beban Gaji, credit Kas/Bank
  → Payslips finalized
```

## Stock Opname Flow

```
Manager creates opname for a location (status: draft)
  → System captures current system quantities
       ↓
Status: in_progress (location stock movements blocked)
       ↓
Staff physically counts each material
  → Enters actual quantities
       ↓
Manager reviews variances
  → Completes opname (status: completed)
  → System creates adjustment movements for each variance
  → Stock balances corrected
```

## Daily Operations (Manager)

```
Morning:
  1. Check dashboard — low stock alerts
  2. Create transfer requests if needed
  3. Verify shift schedule — staffing OK?

During day:
  4. POS transactions processed by cashiers
  5. Receive transfers / supplier deliveries
  6. Monitor sales in real-time

End of day:
  7. Cashier closes shift → cash count
  8. Review daily sales summary
  9. All journals auto-posted
```

## State Machines

### Order

| From | To | Trigger |
|------|----|---------|
| — | `open` | Order created |
| `open` | `completed` | Payment recorded (total covered) |
| `open` | `voided` | Full void (before payment) |
| `completed` | `voided` | Full void (after payment, reversal) |

### Order Line

| From | To | Trigger |
|------|----|---------|
| — | `active` | Line added |
| `active` | `voided` | Partial void |

### Transfer Request

| From | To | Trigger |
|------|----|---------|
| — | `requested` | Created |
| `requested` | `in_transit` | Source confirms shipment |
| `in_transit` | `received` | Destination confirms receipt |
| `requested` | `cancelled` | Requester cancels |

### Stock Opname

| From | To | Trigger |
|------|----|---------|
| — | `draft` | Created |
| `draft` | `in_progress` | Counting starts |
| `in_progress` | `completed` | Counts finalized |
| `draft` | `cancelled` | Cancelled |

### Cashier Shift

| From | To | Trigger |
|------|----|---------|
| — | `open` | Cashier opens |
| `open` | `closed` | Shift closed (cash counted) |

### Payroll Run

| From | To | Trigger |
|------|----|---------|
| — | `draft` | Created |
| `draft` | `calculated` | System computes |
| `calculated` | `approved` | Owner approves |
| `approved` | `paid` | Payment disbursed |

### Journal Entry

| From | To | Trigger |
|------|----|---------|
| — | `draft` | Created (manual) |
| `draft` | `posted` | User posts |
| `posted` | `voided` | Reversing entry created |

Auto-generated journals skip `draft` → created directly as `posted`.

### Leave Request

| From | To | Trigger |
|------|----|---------|
| — | `pending` | Employee submits |
| `pending` | `approved` | Manager approves |
| `pending` | `rejected` | Manager rejects |

### AP (Accounts Payable)

| From | To | Trigger |
|------|----|---------|
| — | `unpaid` | Credit purchase received |
| `unpaid` | `partial` | Partial payment made |
| `partial` | `paid` | Remaining paid |
| `unpaid` | `paid` | Full payment at once |

---

**Next:** [11-glossary.md](./11-glossary.md) — Domain terminology.

# Workflows

Key business workflows and state machines that span multiple modules.

## Daily operations (Store Manager)

```
Morning:
  1. Check low stock alerts (Dashboard)
  2. Create purchase orders for needed materials (Purchasing)
  3. Start production orders for daily prep (Production)

During day:
  4. POS sales sync automatically (Integration)
  5. Receive supplier deliveries → goods receipt (Purchasing)
  6. Record any waste/damage → stock adjustment (Inventory)

End of day:
  7. Complete production orders (Production)
  8. Run settlement → reconcile cash/card (Payment)
  9. Review daily sales summary (Dashboard)
```

## Purchase-to-Pay

```
[Need identified] → PO Created (draft)
                       ↓
                  PO Submitted → Approved (if over threshold)
                       ↓
                  PO Sent to supplier
                       ↓
              Goods Received (partial or full)
                 ↓ (auto)
              Stock-in transaction created
              Material cost updated (weighted avg)
                       ↓
              Supplier Invoice received
                 ↓ (auto)
              AP journal entry (debit: inventory, credit: AP)
                       ↓
              Payment made to supplier
                 ↓ (auto)
              Payment journal (debit: AP, credit: cash/bank)
                       ↓
                    PO Closed
```

## Production cycle

```
[Recipe selected] → Production Order (draft)
                       ↓ (auto-populate from recipe)
                  Material requirements listed
                       ↓
                  Order started (in_progress)
                       ↓
                  Actual consumption recorded
                  (may differ from recipe)
                       ↓
                  Order completed
                    ↓ (auto)
                  Materials deducted from stock
                  Finished product added to stock
                  COGS calculated (actual material cost)
                  Journal: debit FG inventory, credit RM inventory
```

## Sales-to-Cash

```
[POS Transaction] → Synced to ERP as Sales Order
                       ↓ (auto)
                  Product stock deducted
                  COGS journal entry
                  Revenue journal entry
                       ↓
                  Payment recorded (cash/card/e-wallet)
                       ↓ (auto)
                  Payment journal entry
                       ↓
              End of day: Settlement
                  Expected amount calculated
                  Actual amount entered
                  Variance recorded (if any)
```

## Stock transfer

```
[Source location] → Transfer Out created
                       ↓
                  Stock deducted from source
                       ↓
               [In transit]
                       ↓
              [Dest location] → Transfer In received
                       ↓
                  Stock added to destination
```

## Month-end close

```
1. Verify all sales synced (no pending)
2. Complete all open production orders
3. Run stock opname (physical count)
4. Reconcile bank statements
5. Review auto-generated journals
6. Post any manual adjustments
7. Generate financial reports (P&L, BS)
8. Close fiscal period
```

## State machine: Purchase Order

| From | To | Trigger |
| ---- | -- | ------- |
| - | `draft` | Created |
| `draft` | `submitted` | User submits |
| `submitted` | `approved` | Approver approves |
| `submitted` | `rejected` | Approver rejects |
| `approved` | `ordered` | Sent to supplier |
| `ordered` | `partially_received` | Partial goods receipt |
| `partially_received` | `received` | Final goods receipt |
| `ordered` | `received` | Full goods receipt (single delivery) |
| `received` | `invoiced` | Invoice entered |
| `invoiced` | `paid` | Payment made |
| `paid` | `closed` | Archived |
| any | `cancelled` | User cancels (before received) |

## State machine: Production Order

| From | To | Trigger |
| ---- | -- | ------- |
| - | `draft` | Created |
| `draft` | `in_progress` | User starts |
| `in_progress` | `completed` | User completes (stock movements fire) |
| `in_progress` | `cancelled` | User cancels (no stock impact) |
| `completed` | `closed` | Archived |

## State machine: Sales Return

| From | To | Trigger |
| ---- | -- | ------- |
| - | `pending` | Return created |
| `pending` | `approved` | Manager approves |
| `approved` | `completed` | Stock returned, refund issued |
| `pending` | `rejected` | Manager rejects |

---

**Next:** [10-glossary.md](./10-glossary.md) — Domain terminology.

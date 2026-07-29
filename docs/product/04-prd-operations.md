# PRD: Operations

Specifications for Inventory, Purchasing, Production, Sales, and Payment modules.

## Inventory

### Purpose

Track stock levels, movements, and valuations per location.

### Core concepts

| Concept | Description |
| ------- | ----------- |
| Stock Balance | Current quantity of a material/product at a location |
| Stock Transaction | Any movement that changes stock (in, out, transfer, adjustment) |
| Stock Opname | Physical count reconciliation |
| Stock Transfer | Move stock between locations |

### Transaction types

| Type | Direction | Trigger |
| ---- | --------- | ------- |
| `purchase_receipt` | IN | Goods received from supplier |
| `production_output` | IN | Finished goods from production |
| `transfer_in` | IN | Received from another location |
| `sales` | OUT | Sold to customer |
| `production_consumption` | OUT | Materials consumed in production |
| `transfer_out` | OUT | Sent to another location |
| `adjustment_in` | IN | Manual correction (surplus) |
| `adjustment_out` | OUT | Manual correction (shortage/waste) |
| `return_in` | IN | Customer return |
| `return_out` | OUT | Return to supplier |

### Stock valuation

- Materials: weighted average cost (updated on each purchase receipt).
- Products: calculated from recipe COGS (theoretical) or actual production cost.

### Business rules

- Stock cannot go negative (enforce at transaction level).
- Every stock movement creates an inventory transaction record.
- Stock opname creates adjustment transactions for discrepancies.
- Transfer requires both source and destination to be active locations.

## Purchasing

### Purpose

Manage the procurement cycle: request → order → receipt → invoice → payment.

### Status flow

```
draft → submitted → approved → ordered → partially_received → received → invoiced → paid → closed
                  → rejected
```

### Entities

| Entity | Description |
| ------ | ----------- |
| Purchase Order (PO) | Order sent to supplier |
| PO Line | Item + qty + price on the PO |
| Goods Receipt | Physical receipt of goods (partial or full) |
| Purchase Invoice | Supplier's bill |

### Key features

- Multi-line PO with different materials.
- Partial receiving (receive 80 of 100 ordered).
- 3-way matching: PO qty vs receipt qty vs invoice qty.
- Auto-generate stock-in transaction on goods receipt.
- Purchase creates journal entry (debit: inventory asset, credit: accounts payable).

### Business rules

- PO requires approval if amount > configurable threshold.
- Cannot receive more than ordered quantity.
- Invoice amount must match within tolerance (configurable %).
- Goods receipt updates material weighted average cost.

## Production

### Purpose

Track manufacturing/preparation — converting materials into products.

### Status flow

```
draft → in_progress → completed → closed
                    → cancelled
```

### Entities

| Entity | Description |
| ------ | ----------- |
| Production Order | Instruction to produce N units of a product |
| Consumption Line | Material consumed (from recipe or manual) |
| Output Line | Product(s) produced |

### Key features

- Create from recipe (auto-populate consumption lines) or manual entry.
- Record actual consumption vs theoretical (yield variance).
- Auto-deduct materials from stock on completion.
- Auto-add finished product to stock on completion.
- Production cost = sum of actual material costs consumed.

### Business rules

- Cannot complete if insufficient material stock.
- Actual yield can differ from recipe yield (tracked as variance).
- Production creates journal entry (debit: WIP/finished goods, credit: raw materials).

## Sales

### Purpose

Record and manage sales transactions (primarily fed from POS).

### Entities

| Entity | Description |
| ------ | ----------- |
| Sales Order | A completed sale (header) |
| Sales Line | Product + qty + price + discount on the sale |
| Sales Return | Refund/return of a previous sale |

### Key features

- Sales typically ingested from external POS (not manually created).
- Each sale is location-scoped and sales-type tagged.
- Discount at line level and order level.
- Tax calculation (inclusive or exclusive, configurable).
- Sales return creates stock-in transaction + reverse journal.

### Business rules

- Sales deduct product stock (or material stock if no product inventory).
- Each sale creates a journal entry (debit: cash/receivable, credit: revenue).
- Returns must reference the original sale.
- Cannot return more than original quantity.

## Payment

### Purpose

Track payment methods, settlements, and reconciliation.

### Entities

| Entity | Description |
| ------ | ----------- |
| Payment Method | Cash, card, transfer, e-wallet, etc. |
| Payment | Actual payment received (linked to sales or other documents) |
| Settlement | End-of-day settlement batch per location |

### Key features

- Multiple payment methods per sale (split payment).
- Daily settlement: reconcile expected vs actual cash/card totals.
- Payment creates journal entry (debit: bank/cash, credit: receivable).
- Track payment gateway fees (e.g., MDR for card payments).

### Business rules

- Total payments must equal sale amount (no partial payment in v1).
- Settlement is per-location, per-day.
- Variance in settlement is recorded as adjustment (over/short).

---

**Next:** [05-prd-finance.md](./05-prd-finance.md) — Finance module.

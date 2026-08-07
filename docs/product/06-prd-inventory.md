# PRD: Inventory

Specifications for stock balance tracking, stock movements, transfer requests, and stock opname (physical count).

## Core Concepts

| Concept | Description |
|---------|-------------|
| Stock Balance | Current quantity of a material at a specific location |
| Stock Movement | Any event that changes stock (receipt, sale, transfer, adjustment) |
| Transfer Request | Request to move materials from one location to another |
| Stock Opname | Physical count reconciliation against system balance |

## Stock Balance

### Fields

| Field | Type | Description |
|-------|------|-------------|
| materialId | FK | Which material |
| locationId | FK | Which location (store or warehouse) |
| quantity | decimal | Current on-hand (in storage UoM) |

### Business Rules

- One record per material per location.
- `quantity` cannot go negative. Operations that would cause this are rejected.
- Updated transactionally with every stock movement.
- Stores AND warehouses both have stock balances (stores hold operational stock).

## Stock Movement

### Fields

| Field | Type | Description |
|-------|------|-------------|
| materialId | FK | Material affected |
| locationId | FK | Location affected |
| type | enum | Movement type |
| direction | enum | `in`, `out` |
| quantity | decimal | Amount moved (always positive) |
| costPrice | decimal | Unit cost at time of movement (storage UoM) |
| referenceType | string? | Source document type |
| referenceId | string? | Source document ID |
| notes | string? | Explanation |

### Movement Types

| Type | Direction | Trigger |
|------|-----------|---------|
| `purchase_receipt` | in | Goods received from supplier |
| `transfer_in` | in | Received from another location |
| `adjustment_in` | in | Manual correction (surplus) |
| `return_in` | in | Void/refund restoration |
| `sales` | out | POS order completed (via recipe) |
| `transfer_out` | out | Sent to another location |
| `adjustment_out` | out | Manual correction (waste, expired, shortage) |

### Business Rules

- Every stock change creates a movement record (full audit trail).
- Movements are **immutable** — corrections create new adjustment movements.
- `costPrice` on `purchase_receipt` triggers material weighted average recalculation.
- All movements tracked with `createdBy` (audit).

## Transfer Request

### Purpose

Move materials between any two locations. Request-based flow: requester creates → source location fulfills.

### Transfer Header

| Field | Type | Description |
|-------|------|-------------|
| transferNo | string | Auto-generated number |
| fromLocationId | FK | Source location |
| toLocationId | FK | Destination location (the requester) |
| status | enum | `requested`, `in_transit`, `received`, `cancelled` |
| requestedBy | FK | User who created the request |
| notes | string? | Transfer notes |

### Transfer Line

| Field | Type | Description |
|-------|------|-------------|
| transferId | FK | Parent transfer |
| materialId | FK | Material being transferred |
| requestedQty | decimal | Amount requested (storage UoM) |
| shippedQty | decimal? | Amount actually shipped |
| receivedQty | decimal? | Amount confirmed received |
| uomId | FK | Unit (should be storage UoM) |

### Status Flow

```
requested → in_transit → received
    ↓
 cancelled
```

- `requested` → someone at the destination wants materials.
- `in_transit` → source location confirms shipment, stock deducted from source.
- `received` → destination confirms receipt, stock added to destination.
- `cancelled` → request withdrawn before shipment.

### Business Rules

- **No approval required.** Anyone can request, anyone at source can fulfill.
- **No variance tracking (Phase 1).** Received qty = shipped qty assumed.
- Source must have sufficient stock to ship.
- Cannot transfer to the same location.
- Transfer between any two locations (store↔warehouse, store↔store, warehouse↔warehouse).

## Stock Opname (Physical Count)

### Purpose

Reconcile system stock with actual physical count. Differences auto-create adjustment movements.

### Opname Header

| Field | Type | Description |
|-------|------|-------------|
| opnameNo | string | Auto-generated |
| locationId | FK | Location being counted |
| status | enum | `draft`, `in_progress`, `completed`, `cancelled` |
| startedAt | timestamp | When counting began |
| completedAt | timestamp? | When finalized |
| conductedBy | FK | User performing count |

### Opname Line

| Field | Type | Description |
|-------|------|-------------|
| opnameId | FK | Parent opname |
| materialId | FK | Material counted |
| systemQty | decimal | System balance at time of opname |
| actualQty | decimal | Physical count |
| reason | string? | Explanation for variance |

### Business Rules

- On completion: system creates `adjustment_in` or `adjustment_out` for each variance.
- Only one active opname per location at a time.
- While `in_progress`, other stock movements at that location are blocked.
- Zero-variance lines are recorded too (confirms accuracy).
- Completion requires the user to confirm all counts.

## Minimum Stock Alert

### Logic

```
For each material where minStock is set:
  total = SUM(stock_balance.quantity) across ALL locations
  if total < material.minStock → alert
```

### Display

- Dashboard widget: materials below threshold.
- Sorted by severity (how far below).
- Action: create transfer request or purchase order.

## Receiving (from Supplier)

### Purpose

Record goods arriving from a supplier into a location (warehouse or store).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| locationId | FK | Where goods arrive |
| supplierId | FK? | Which supplier (null for misc) |
| receivedBy | FK | User who received |
| notes | string? | |

### Receiving Line

| Field | Type | Description |
|-------|------|-------------|
| materialId | FK | Material received |
| quantity | decimal | Amount received (in purchase UoM) |
| unitCost | decimal | Cost per unit (purchase UoM) |
| uomId | FK | Purchase UoM |

### On Save

1. Convert quantity from purchase UoM → storage UoM.
2. Create `stock_movement` (type: `purchase_receipt`, direction: `in`).
3. Update `stock_balance` at location.
4. Recalculate material `costPrice` (weighted average).
5. Create journal entry: debit Persediaan, credit Hutang Usaha (if supplier) or Kas (if cash purchase).

---

**Next:** [07-prd-finance.md](./07-prd-finance.md) — Finance module.

# Task Board

Phase 1 development plan for Ikki ERP — Foundation & Daily Ops.

## Pipeline

```
DB Schema → Core Modules → Master Data → Menu/Recipe → POS → Inventory → Production
```

## Status

### Active

(none yet)

### Backlog — Phase 1

| Task | Title | Depends on | Status |
|------|-------|-----------|--------|
| TASK-003 | Database Schema (all Phase 1 tables) | — | DRAFT |
| TASK-004 | Infra: Auth plugin, Number Generator, Audit logger | TASK-003 | DRAFT |
| TASK-005 | Module: Location | TASK-003, TASK-004 | DRAFT |
| TASK-006 | Module: IAM (User, Role, Assignment) | TASK-005 | DRAFT |
| TASK-007 | Module: Auth (Login, Session, Context Switch) | TASK-006 | DRAFT |
| TASK-008 | Module: Company Settings | TASK-007 | DRAFT |
| TASK-009 | Module: UoM + Conversions | TASK-005 | DRAFT |
| TASK-010 | Module: Material (+ Category, Location Assignment) | TASK-009 | DRAFT |
| TASK-011 | Module: Supplier (+ Material Pricing) | TASK-010 | DRAFT |
| TASK-012 | Module: Menu (Items, Categories, Modifiers) | TASK-005 | DRAFT |
| TASK-013 | Module: Recipe (BOM, HPP calculation) | TASK-010, TASK-012 | DRAFT |
| TASK-014 | Module: Payment Method (+ Location Assignment) | TASK-005 | DRAFT |
| TASK-015 | Module: POS/Table | TASK-005 | DRAFT |
| TASK-016 | Module: POS/Shift (Cashier Shifts) | TASK-007, TASK-014 | DRAFT |
| TASK-017 | Module: POS/Voucher | TASK-005 | DRAFT |
| TASK-018 | Module: POS/Order (Orders, Lines, Payments, Auto-deduct) | TASK-013, TASK-015, TASK-016, TASK-017 | DRAFT |
| TASK-019 | Module: Inventory/Stock (Balances, Movements) | TASK-010 | DRAFT |
| TASK-020 | Module: Inventory/Transfer (Requests, Ship, Receive) | TASK-019 | DRAFT |
| TASK-021 | Module: Inventory/Receiving (from Supplier, Cost Recalc) | TASK-011, TASK-019 | DRAFT |
| TASK-022 | Module: Inventory/Opname (Physical Count) | TASK-019 | DRAFT |
| TASK-023 | Module: Production (Recipes, Orders for semi-finished) | TASK-019, TASK-010 | DRAFT |
| TASK-024 | Module: Audit (Audit Log + UI endpoint) | TASK-004 | DRAFT |
| TASK-025 | Integration: POS → Inventory auto-deduct via Recipe | TASK-018, TASK-019 | DRAFT |
| TASK-026 | Seed Data + Dev Environment | TASK-018 | DRAFT |

### Done

| Task | Title |
|------|-------|
| ~~TASK-001~~ | ~~IAM RBAC Overhaul (obsolete — old codebase)~~ |
| ~~TASK-002~~ | ~~Location Module Review (obsolete — old codebase)~~ |

## Dependency Graph

```
TASK-003 (DB Schema)
    ├── TASK-004 (Infra)
    │   ├── TASK-024 (Audit)
    │   └── ...all modules need this
    ├── TASK-005 (Location)
    │   ├── TASK-006 (IAM)
    │   │   └── TASK-007 (Auth)
    │   │       ├── TASK-008 (Company)
    │   │       └── TASK-016 (POS/Shift)
    │   ├── TASK-009 (UoM)
    │   │   └── TASK-010 (Material)
    │   │       ├── TASK-011 (Supplier)
    │   │       │   └── TASK-021 (Inventory/Receiving)
    │   │       ├── TASK-013 (Recipe)
    │   │       ├── TASK-019 (Inventory/Stock)
    │   │       │   ├── TASK-020 (Inventory/Transfer)
    │   │       │   ├── TASK-022 (Inventory/Opname)
    │   │       │   └── TASK-023 (Production)
    │   │       └── TASK-025 (POS→Inventory integration)
    │   ├── TASK-012 (Menu)
    │   │   └── TASK-013 (Recipe)
    │   ├── TASK-014 (Payment Method)
    │   ├── TASK-015 (POS/Table)
    │   └── TASK-017 (POS/Voucher)
    └── TASK-018 (POS/Order) — needs 013, 015, 016, 017
        └── TASK-025 (Integration)
            └── TASK-026 (Seed Data)
```

## Execution Order (Critical Path)

Recommended sequential order respecting dependencies:

```
Session 1:  TASK-003 (DB Schema)
Session 2:  TASK-004 (Infra utilities)
Session 3:  TASK-005 (Location)
Session 4:  TASK-006 (IAM)
Session 5:  TASK-007 (Auth)
Session 6:  TASK-009 (UoM) + TASK-008 (Company) — parallel, no interdep
Session 7:  TASK-010 (Material)
Session 8:  TASK-011 (Supplier) + TASK-014 (Payment Method) — parallel
Session 9:  TASK-012 (Menu + Modifiers)
Session 10: TASK-013 (Recipe)
Session 11: TASK-015 (POS/Table) + TASK-017 (POS/Voucher) — parallel
Session 12: TASK-016 (POS/Shift)
Session 13: TASK-019 (Inventory/Stock)
Session 14: TASK-018 (POS/Order)
Session 15: TASK-020 (Transfer) + TASK-021 (Receiving) + TASK-022 (Opname) — parallel
Session 16: TASK-023 (Production)
Session 17: TASK-024 (Audit) + TASK-025 (POS→Inventory integration)
Session 18: TASK-026 (Seed Data + Final verification)
```

~18 sessions to complete Phase 1.

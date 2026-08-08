# Task Board

Phase 1 development plan for Ikki ERP — Foundation & Daily Ops.

## Pipeline

```
DB Schema → Core Modules → Master Data → Menu/Recipe → POS → Inventory → Production
```

## Status

### Phase 1 — COMPLETE ✅

All 24 tasks done (TASK-003 through TASK-026).

| Task     | Title                                                    | Status  |
| -------- | -------------------------------------------------------- | ------- |
| TASK-003 | Database Schema (all Phase 1 tables)                     | ✅ DONE |
| TASK-004 | Infra: Auth plugin, Number Generator, Audit logger       | ✅ DONE |
| TASK-005 | Module: Location                                         | ✅ DONE |
| TASK-006 | Module: IAM (User, Role, Assignment)                     | ✅ DONE |
| TASK-007 | Module: Auth (Login, Session, Context Switch)            | ✅ DONE |
| TASK-008 | Module: Company Settings                                 | ✅ DONE |
| TASK-009 | Module: UoM + Conversions                                | ✅ DONE |
| TASK-010 | Module: Material (+ Category, Location Assignment)       | ✅ DONE |
| TASK-011 | Module: Supplier (+ Material Pricing)                    | ✅ DONE |
| TASK-012 | Module: Menu (Items, Categories, Modifiers)              | ✅ DONE |
| TASK-013 | Module: Recipe (BOM, HPP calculation)                    | ✅ DONE |
| TASK-014 | Module: Payment Method (+ Location Assignment)           | ✅ DONE |
| TASK-015 | Module: POS/Table                                        | ✅ DONE |
| TASK-016 | Module: POS/Shift (Cashier Shifts)                       | ✅ DONE |
| TASK-017 | Module: POS/Voucher                                      | ✅ DONE |
| TASK-018 | Module: POS/Order (Orders, Lines, Payments)              | ✅ DONE |
| TASK-019 | Module: Inventory/Stock (Balances, Movements)            | ✅ DONE |
| TASK-020 | Module: Inventory/Transfer (Requests, Ship, Receive)     | ✅ DONE |
| TASK-021 | Module: Inventory/Receiving (from Supplier, Cost Recalc) | ✅ DONE |
| TASK-022 | Module: Inventory/Opname (Physical Count)                | ✅ DONE |
| TASK-023 | Module: Production (Recipes, Orders for semi-finished)   | ✅ DONE |
| TASK-024 | Module: Audit (Audit Log read endpoints)                 | ✅ DONE |
| TASK-025 | Integration: POS → Inventory auto-deduct via Recipe      | ✅ DONE |
| TASK-026 | Seed Data + Dev Environment                              | ✅ DONE |

### Skipped

| Task     | Title                  | Reason                              |
| -------- | ---------------------- | ----------------------------------- |
| TASK-001 | IAM RBAC Overhaul      | Legacy task, absorbed into TASK-006 |
| TASK-002 | Location Module Review | Legacy task, absorbed into TASK-005 |

### Phase 2 — Hardening & Refinement

| Task     | Title                            | Status   |
| -------- | -------------------------------- | -------- |
| TASK-027 | Decimal/Money Precision Refactor | GROOMING |

---

## Phase 1 Notes & Deferred Items

### Pending items (carry to Phase 2+)

| Item                                                | Origin   | Priority                            |
| --------------------------------------------------- | -------- | ----------------------------------- |
| Location-based auth on transfer ship/receive        | TASK-020 | Medium                              |
| Rate limiting on /auth/login                        | TASK-007 | Low                                 |
| Voucher `decrementUsage` on void-after-complete     | TASK-018 | Low (void only from open currently) |
| Web codegen (`generate:endpoints` + `generate:web`) | All      | High — do before frontend           |
| Audit log entries in seed scripts                   | TASK-026 | Low                                 |

### Key design decisions (reference)

| Decision                                   | Context                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| DB enum `'open'` not `'draft'` for orders  | TASK-018 — matches existing schema                                 |
| taxRate stored as percentage (11.00 = 11%) | Divided by 100 in calculation                                      |
| Transfer uses `in_transit` DB enum         | TASK-020 — partial receive stays `in_transit` until all lines done |
| Multiple auth sessions coexist             | TASK-007 — no forced logout on re-login                            |
| Stock opname uses snapshot-at-creation     | TASK-022 — subsequent movements don't affect comparison            |
| Overpayment blocked (strict sum ≤ total)   | TASK-018 — cashier cannot overpay                                  |
| Seed uses raw postgres.js not drizzle      | TASK-026 — scripts are standalone                                  |
| POS deduction: floor at 0, log shortage    | TASK-025 — never block cashier                                     |
| Negative stock prevented in stock engine   | TASK-019 — except POS deduction (Option C)                         |

### Known tech debt

| Issue                                | Impact                                         | Fix                                     |
| ------------------------------------ | ---------------------------------------------- | --------------------------------------- |
| Float/decimal precision in JS        | Money rounding errors, weighted avg drift      | TASK-027                                |
| FK name truncation (Postgres NOTICE) | Cosmetic — constraint works, name is truncated | Low priority — explicit names if needed |
| Table module was built but not wired | Fixed in TASK-018 session                      | ✅ Resolved                             |

---

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

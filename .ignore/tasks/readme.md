# Task Board

Ikki ERP development task tracker.

## Status

### Phase 1 — Foundation & Daily Ops ✅ COMPLETE

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

### Phase 2 — Hardening & Observability ✅ COMPLETE

| Task     | Title                                               | Status  |
| -------- | --------------------------------------------------- | ------- |
| TASK-027 | Decimal/Money Precision Refactor                    | ✅ DONE |
| TASK-028 | OpenTelemetry Setup (@elysia/opentelemetry + Axiom) | ✅ DONE |
| TASK-029 | Structured Logging (LogTape + OTel Bridge)          | ✅ DONE |
| TASK-030 | Centralize Env Config (Zod-Validated)               | ✅ DONE |

### Skipped / Legacy

| Task     | Title                  | Reason                         |
| -------- | ---------------------- | ------------------------------ |
| TASK-001 | IAM RBAC Overhaul      | Legacy, absorbed into TASK-006 |
| TASK-002 | Location Module Review | Legacy, absorbed into TASK-005 |

---

## Deferred Items (carry to future phases)

| Item                                                | Origin   | Priority                  |
| --------------------------------------------------- | -------- | ------------------------- |
| Location-based auth on transfer ship/receive        | TASK-020 | Medium                    |
| Rate limiting on /auth/login                        | TASK-007 | Low                       |
| Voucher `decrementUsage` on void-after-complete     | TASK-018 | Low                       |
| Web codegen (`generate:endpoints` + `generate:web`) | All      | High — do before frontend |
| Audit log entries in seed scripts                   | TASK-026 | Low                       |

---

## Key Design Decisions

| Decision                                                 | Context                                          |
| -------------------------------------------------------- | ------------------------------------------------ |
| DB enum `'open'` not `'draft'` for orders                | TASK-018 — matches existing schema               |
| taxRate stored as percentage (11.00 = 11%)               | Divided by 100 in calculation                    |
| Transfer uses `in_transit` DB enum                       | TASK-020 — partial receive stays `in_transit`    |
| Multiple auth sessions coexist                           | TASK-007 — no forced logout                      |
| Stock opname uses snapshot-at-creation                   | TASK-022 — subsequent movements don't affect     |
| Overpayment blocked (strict sum ≤ total)                 | TASK-018 — cashier cannot overpay                |
| Seed uses raw postgres.js not drizzle                    | TASK-026 — standalone scripts                    |
| POS deduction: floor at 0, log shortage                  | TASK-025 — never block cashier                   |
| Negative stock prevented in stock engine                 | TASK-019 — except POS deduction (Option C)       |
| Money: integer IDR for prices, Decimal for costs         | TASK-027 — `decimal.js` via shared utils         |
| OTel: record() only at boundaries, 3-7 per request       | TASK-028 — orchestrations + batch + expensive    |
| Logging: LogTape structured, never console.\*            | TASK-029 — `@logtape/otel` for trace correlation |
| Env: centralized Zod-validated, never Bun.env in modules | TASK-030 — fail-fast on startup                  |

---

## Resolved Tech Debt

| Issue                                | Resolution                                               |
| ------------------------------------ | -------------------------------------------------------- |
| Float/decimal precision              | ✅ TASK-027 — `decimal.js` via `@/shared/utils/money.ts` |
| No structured logging                | ✅ TASK-029 — LogTape + OTel bridge                      |
| No tracing/observability             | ✅ TASK-028 — `@elysiajs/opentelemetry` + Axiom          |
| Scattered env access                 | ✅ TASK-030 — `@/shared/config/env.ts`                   |
| FK name truncation (Postgres NOTICE) | Cosmetic — low priority                                  |

---

## Dependency Graph (Phase 1)

```
TASK-003 (DB Schema)
├── TASK-004 (Infra)
│   ├── TASK-024 (Audit)
│   └── ...all modules
├── TASK-005 (Location)
│   ├── TASK-006 (IAM) → TASK-007 (Auth) → TASK-008 (Company)
│   ├── TASK-009 (UoM) → TASK-010 (Material)
│   │   ├── TASK-011 (Supplier) → TASK-021 (Receiving)
│   │   ├── TASK-013 (Recipe)
│   │   ├── TASK-019 (Stock) → TASK-020 (Transfer), TASK-022 (Opname), TASK-023 (Production)
│   │   └── TASK-025 (POS→Inventory)
│   ├── TASK-012 (Menu) → TASK-013 (Recipe)
│   ├── TASK-014 (Payment Method)
│   ├── TASK-015 (POS/Table)
│   └── TASK-017 (POS/Voucher)
└── TASK-018 (POS/Order) → TASK-025 (Integration) → TASK-026 (Seed)
```

## Phase 2 Dependencies

```
TASK-027 (Money)     ← independent
TASK-028 (OTel)      ← independent
TASK-029 (Logging)   ← after TASK-028 (OTel bridge needs OTel setup)
TASK-030 (Env)       ← independent
```

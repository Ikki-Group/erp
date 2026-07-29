# Development Timeline

Phased delivery plan for Ikki ERP — assumes solo developer with AI-assisted development, targeting production use at each phase boundary.

## Assumptions

- Solo developer, full-time, AI-augmented (2–3x velocity vs traditional).
- Bun + Elysia + Drizzle stack (already familiar).
- PostgreSQL + Redis infra ready from day 1.
- Frontend (React + TanStack) developed in parallel with backend per phase.
- Each phase ends with a deployable, usable system — not a prototype.

## Overview

| Phase | Name | Duration | Cumulative |
| ----- | ---- | -------- | ---------- |
| 0 | Foundation | 1 week | Week 1 |
| 1 | Core + Inventory + Sales | 4 weeks | Week 5 |
| 2 | Production + Purchasing | 4 weeks | Week 9 |
| 3 | Finance | 3 weeks | Week 12 |
| 4 | Integration + Analytics | 3 weeks | Week 15 |
| 5 | HR + Polish | 2 weeks | Week 17 |

**Total: ~17 weeks (4 months)**

## Phase 0 — Foundation (Week 1)

Setup infrastructure, standards, and skeleton.

| Task | Effort |
| ---- | ------ |
| Project setup (monorepo, toolchain, CI) | 1 day |
| Database setup (PostgreSQL, migrations, seed scripts) | 1 day |
| Server skeleton (Elysia, auth plugin, error handler, OTEL) | 1 day |
| Shared utilities (schema primitives, audit, cache, pagination) | 1 day |
| Web skeleton (React, TanStack Router, auth flow, layout) | 1 day |

**Deliverable:** Empty running app with login screen, no business logic.

## Phase 1 — Core + Inventory + Sales (Weeks 2–5)

The MVP — replaces spreadsheet-based stock and sales tracking.

### Week 2: Core modules

| Task | Effort |
| ---- | ------ |
| IAM (user, role, permission, assignment) — backend | 2 days |
| IAM — frontend (user list, role management) | 1.5 days |
| Auth (login, session, logout) — backend + frontend | 1 day |
| Company settings — backend + frontend | 0.5 days |

### Week 3: Location + Master data

| Task | Effort |
| ---- | ------ |
| Location module — backend + frontend | 1 day |
| UoM module — backend + frontend | 0.5 days |
| Sales Type module — backend + frontend | 0.5 days |
| Product module (categories, variants, pricing) — backend | 2 days |
| Product — frontend (CRUD, variant management) | 1 day |

### Week 4: Inventory

| Task | Effort |
| ---- | ------ |
| Material module — backend + frontend | 1.5 days |
| Inventory transactions (stock in/out/adjustment) — backend | 2 days |
| Stock balance tracking + low stock alerts | 0.5 days |
| Inventory — frontend (stock view, adjustment, transfer) | 1 day |

### Week 5: Sales + Payment

| Task | Effort |
| ---- | ------ |
| Sales Order module (manual entry) — backend | 1.5 days |
| Payment module (methods, recording) — backend | 1 day |
| Sales + Payment — frontend | 1.5 days |
| Dashboard v1 (today's revenue, stock alerts) | 1 day |

**Deliverable:** Working system with users, products, stock tracking, manual sales entry, and basic dashboard.

## Phase 2 — Production + Purchasing (Weeks 6–9)

Automate COGS and procurement.

### Week 6: Recipe + Production

| Task | Effort |
| ---- | ------ |
| Recipe module (BOM, lines, yield) — backend | 1.5 days |
| Recipe — frontend | 1 day |
| Production Order module (draft → complete) — backend | 2 days |
| Auto stock-deduction on production completion | 0.5 days |

### Week 7: Production frontend + Supplier

| Task | Effort |
| ---- | ------ |
| Production — frontend (create, consume, complete) | 1.5 days |
| Supplier module — backend + frontend | 1 day |
| Supplier-material price list | 0.5 days |
| COGS calculation (theoretical from recipe) | 1 day |
| Production variance tracking | 0.5 days |

### Week 8: Purchasing backend

| Task | Effort |
| ---- | ------ |
| Purchase Order module (full lifecycle) — backend | 2.5 days |
| Goods Receipt module — backend | 1.5 days |
| Auto stock-in on receipt + cost update (weighted avg) | 0.5 days |
| Purchase Invoice module — backend | 0.5 days |

### Week 9: Purchasing frontend + Stock transfer

| Task | Effort |
| ---- | ------ |
| Purchasing — frontend (PO creation, approval, receipt) | 2 days |
| Stock transfer between locations — backend + frontend | 1.5 days |
| Stock opname (physical count reconciliation) | 1.5 days |

**Deliverable:** Full production-to-procurement cycle automated. COGS calculated from actual material costs.

## Phase 3 — Finance (Weeks 10–12)

Double-entry accounting integrated with operations.

### Week 10: Chart of Accounts + Journal

| Task | Effort |
| ---- | ------ |
| Chart of Accounts (CRUD, hierarchy, system accounts) — backend | 1.5 days |
| Journal Entry module (manual entries) — backend | 2 days |
| Auto-journal mapping (sales, purchase, production) — backend | 1.5 days |

### Week 11: Ledger + Reports

| Task | Effort |
| ---- | ------ |
| General Ledger (running balance per account) | 1.5 days |
| Financial reports (Trial Balance, P&L, Balance Sheet) — backend | 2 days |
| Fiscal period management (open/close) | 0.5 days |
| Finance — frontend (CoA tree, journal list, entry form) | 1 day |

### Week 12: Finance frontend + Settlement

| Task | Effort |
| ---- | ------ |
| Financial reports — frontend (P&L, BS, GL viewer) | 2 days |
| Daily settlement (end-of-day reconciliation) — backend + frontend | 1.5 days |
| Payment journal automation | 0.5 days |
| Stock valuation report | 1 day |

**Deliverable:** Complete financial visibility. P&L, Balance Sheet, and GL all auto-generated from operations.

## Phase 4 — Integration + Analytics (Weeks 13–15)

Connect to external systems and build intelligence layer.

### Week 13: Moka POS integration

| Task | Effort |
| ---- | ------ |
| Moka API client (auth, fetch transactions) | 1.5 days |
| Product mapping (Moka item → ERP product) | 1 day |
| Sales sync engine (polling, dedup, cursor) | 2 days |
| Auto journal + stock deduction on sync | 0.5 days |

### Week 14: CRM + Analytics

| Task | Effort |
| ---- | ------ |
| Customer module (CRUD, loyalty points) — backend + frontend | 1.5 days |
| Loyalty: earn on purchase, redeem for discount | 1 day |
| Moka sync — frontend (mapping UI, sync status, logs) | 1 day |
| Dashboard v2 (margin, top products, trends) | 1.5 days |

### Week 15: Reporting + Audit

| Task | Effort |
| ---- | ------ |
| Reporting module (sales summary, stock movement, purchase summary) | 2 days |
| Report export (CSV) | 0.5 days |
| Audit Log module — backend + frontend | 1 day |
| E2E testing + bug fixes | 1.5 days |

**Deliverable:** POS data flows automatically into ERP. Dashboard shows real business intelligence.

## Phase 5 — HR + Polish (Weeks 16–17)

Basic HR and production hardening.

### Week 16: HR

| Task | Effort |
| ---- | ------ |
| Employee module — backend + frontend | 1 day |
| Attendance module — backend + frontend | 1.5 days |
| Payroll calculation engine | 1.5 days |
| Payroll — frontend (run, approve, pay) | 1 day |

### Week 17: Polish

| Task | Effort |
| ---- | ------ |
| Payroll → journal entry integration | 0.5 days |
| Performance optimization (query tuning, caching) | 1 day |
| Security hardening (rate limiting, input validation audit) | 0.5 days |
| Documentation finalization | 0.5 days |
| End-to-end smoke test (all workflows) | 0.5 days |
| Deploy to production | 0.5 days |
| Buffer / overflow | 1.5 days |

**Deliverable:** Complete ERP system deployed and operational.

## Risk buffer

| Risk | Mitigation |
| ---- | ---------- |
| Phase 3 (finance) takes longer than estimated | Auto-journal can ship as Phase 4 addon |
| Moka API limitations / rate limits | Batch sync every 15 min instead of 5 min |
| Frontend complexity underestimated | Ship backend-first, basic UI, iterate |
| Solo dev burnout | Buffer days built into each phase |

## Post-launch (ongoing)

- Multi-tenant support
- Mobile app (React Native)
- Advanced reporting (custom report builder)
- E-commerce integration (Tokopedia, Shopee)
- PDF exports (invoice, receipt, payslip)
- Approval workflows (configurable)

---

**Next:** [readme.md](./readme.md) — Back to the index.

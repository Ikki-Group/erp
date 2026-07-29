# Vision

Ikki ERP is a lightweight, integrated ERP system for small-to-medium F&B and retail businesses operating across multiple locations.

## Problem

Small F&B businesses with 2–20 locations face:

- **Fragmented systems.** POS, inventory, accounting, and HR in separate tools that don't talk to each other.
- **No production visibility.** Recipe costing, material consumption, and yield tracking are manual spreadsheets.
- **Cash flow blindness.** Revenue is known, but COGS, margins, and profitability per product/location are not.
- **Operational chaos.** Stock transfers, purchase orders, and supplier payments are managed via chat/paper.

## Solution

A single system that connects sales → inventory → production → purchasing → finance in real-time, scoped per location.

## Target user

| Persona | Role | Primary need |
| ------- | ---- | ------------ |
| Owner | Business owner (1–3 people) | P&L visibility, margin analysis, multi-location oversight |
| Store Manager | Per-location operator | Daily operations: stock, production, sales reconciliation |
| Finance | Accountant / bookkeeper | Journal entries, tax reporting, payment reconciliation |
| Kitchen | Production lead | Production orders, material usage, recipe adherence |

## Product principles

1. **Location-scoped by default.** Every transaction belongs to a location. Cross-location operations (transfers, consolidated reports) are explicit.
2. **Double-entry always.** No financial event happens without a balanced journal entry. This is non-negotiable.
3. **POS is the front door.** Sales originate from external POS (Moka, etc). The ERP is the back-office brain, not the cashier.
4. **Progressive disclosure.** A new user starts with inventory + sales. Production, purchasing, and finance unlock as needed.
5. **Offline-tolerant sync.** POS data arrives asynchronously. The system handles late, duplicate, and out-of-order transactions gracefully.

## Success metrics

| Metric | Target | Measurement |
| ------ | ------ | ----------- |
| Time to close daily books | < 15 minutes | From end-of-day to all journals posted |
| Stock accuracy | > 95% | Physical count vs system count |
| COGS visibility | Real-time | Automatic from production + purchasing |
| Multi-location setup | < 1 day | New location operational within 24h |

## Non-goals (v1)

- Not a POS system. We integrate with POS, not replace it.
- Not an e-commerce platform. Order ingestion is possible, but storefront is external.
- Not a full HRIS. Basic employee + attendance + payroll only.
- Not multi-tenant SaaS (yet). Single-company deployment.

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Runtime | Bun |
| API framework | Elysia |
| Database | PostgreSQL |
| ORM | Drizzle |
| Cache | Redis (BentoCache) |
| Validation | Zod |
| Frontend | React 19 + Vite + TanStack Router |
| Auth | Session-based (Redis-backed) |
| Observability | OpenTelemetry + LogTape |

## Phasing

### Phase 1 — Foundation (MVP)

Core + Location + Product + Inventory + Sales + Payment + Dashboard

Goal: Replace spreadsheet-based stock and sales tracking.

### Phase 2 — Production & Purchasing

Material + Recipe + Production + Supplier + Purchasing + Finance (basic)

Goal: Automate COGS calculation and purchase workflows.

### Phase 3 — Finance & Integration

Full Finance (GL, P&L, Balance Sheet) + POS Integration + CRM/Loyalty + HR

Goal: Eliminate the need for separate accounting software.

---

**Next:** [02-prd-core.md](./02-prd-core.md) — Core modules specification.

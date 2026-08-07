# Vision

Ikki ERP is an integrated operational system for Ikki Group — a single F&B business running Ikki Coffee (cafe) and Ikki Resto (restaurant).

## Problem

Ikki operates with fragmented manual processes:

- Stock quantities across locations are unknown until physically counted.
- HPP per menu item is estimated, not calculated from actual material costs.
- Sales data sits in Moka with no connection to inventory or finance.
- No financial system — accounting is done retroactively by external parties.
- Employee shifts, attendance, and payroll managed via paper/chat.
- No customer database or loyalty program.

## Solution

A single web application connecting: POS → Inventory → Recipe → Finance, with HR and CRM as supporting modules. All operational data flows through one system.

## Target Users

| Persona         | Primary need                                              |
| --------------- | --------------------------------------------------------- |
| Owner           | P&L visibility, multi-location overview, decision support |
| Manager         | Daily operations: stock alerts, sales summary, staffing   |
| Cashier         | Fast order entry, open/close bill, shift management       |
| Warehouse Staff | Receive goods, fulfill transfer requests, stock opname    |
| Accountant      | Journal entries, financial reports, reconciliation        |

## Product Principles

1. **Location as the operational unit.** Every transaction, stock record, and shift belongs to a location. Users switch context by location.
2. **Built-in POS with multi-source support.** Own POS module AND import from Moka.
3. **Recipe drives COGS.** Every menu item has a BOM. Selling auto-deducts material stock.
4. **Proper accounting.** Double-entry accrual. Every monetary event → balanced journal.
5. **Global materials, local menus.** Materials shared across all locations. Menus are per-location (Coffee and Resto sell different things).
6. **Audit everything.** Who did what, when — tracked on every mutation.

## Success Metrics

| Metric                  | Target                                   |
| ----------------------- | ---------------------------------------- |
| Stock accuracy          | > 95% (physical count vs system)         |
| HPP visibility          | Real-time per menu item                  |
| Daily close time        | < 15 min (shift close → journals posted) |
| New location onboarding | < 1 day                                  |

## Non-Goals (Phase 1)

- Not multi-tenant SaaS.
- Not offline-capable (requires internet).
- Not a mobile app (web-only, tablet-friendly for POS).
- Modifier → recipe override (backlog — base recipe only).

## Tech Stack

| Layer      | Choice                            |
| ---------- | --------------------------------- |
| Runtime    | Bun                               |
| API        | Elysia                            |
| Database   | PostgreSQL (Neon — serverless)    |
| ORM        | Drizzle                           |
| Cache      | In-memory (single instance)       |
| Validation | Zod                               |
| Frontend   | React 19 + Vite + TanStack Router |
| Auth       | Session-based (in-memory store)   |

---

**Next:** [02-prd-core.md](./02-prd-core.md) — Core modules.

# Backend Redesign — Wayfinder Map

`wayfinder:map` · local-markdown tracker · created 2026-09-13

## Destination

A set of **grilled, battle-tested backend ADRs** — covering both architecture decisions and core-operations domain decisions — where every decision has been pressed until it holds, replacing the AI-generated foundation (archived `docs/server-redesign/` ADRs + AI-generated `docs/product/` PRDs) that was never human-tested. Ready to hand off to `/to-tickets`.

The map is done when every in-scope decision area has an ADR that survived grilling, with nothing left to decide before implementation begins.

## Notes

- **Domain:** F&B ERP for Ikki Group (Ikki Coffee cafe + Ikki Resto + warehouses). Single business, not multi-tenant. Product currently in grooming — **not tested**, so NO backward-compatibility burden: replace, don't preserve legacy.
- **Existing code:** the technical/code layer (vertical slice, UoW, Money/Qty, cache port, module registry) is considered basically sound by the owner. The doubt is about **application/feature design** — what is being built — and about foundations being AI-generated and unproven.
- **Raw material to press (NOT sources of truth — review them):**
  - `docs/product/` — AI-generated PRDs (vision, glossary, core, master-data, costing, menu, POS, inventory, production, finance, HR, CRM, workflows, timeline).
  - `docs/_archive/server-redesign/` — archived redesign: 10 ADRs + golden-path specs. SUPERSEDED, historical reference only.
- **Executor:** implementation will be driven by `GPT-Luna`. Spec/ADR style must suit that (explicit, mechanical where it matters).
- **Language:** ADRs and all docs in **English**. Conversation in Bahasa Indonesia.
- **Skills every session should consult:** `grilling` + `domain-modeling` for every grilling ticket; `codebase-design` when a ticket touches module shape/seams.
- **Live P0/P1 the redesign must fix (evidence from current code):** fire-and-forget stock deduction after order commit; no real transactions in POS/inventory; `Number(string)` money; audit fire-and-forget with empty actor name; POS/inventory routes authenticate but don't authorize.

## Decisions so far

<!-- one line per closed ticket, then zoom the link for detail -->

- [F1 · Canonical module standard](./tickets/F1-module-standard.md): flat-hybrid ratified (supersedes archived five-folder ADR-0001) + mandatory pure-domain separation into `*.rules.ts`/`*.calculator.ts`; naming `IXxxRepo`/`XxxRepo`/`XxxService.handle*`; infra from `ctx`, cross-module via static `Api` only. → `docs/adr/0001-module-standard.md`, `CONTEXT.md`.

## Not yet specified

Fog toward the destination, in scope but not yet sharp enough to ticket. Graduates as the frontier advances.

- **Per-module domain grilling for each core-operations module** — each becomes its own grilling ticket once the foundation tickets it depends on are settled. Suspected areas: Core (Location store-vs-warehouse, Company settings, per-location daily-reset numbering), Master Data (global material + location assignment, UoM chain multi-hop conversion), Costing (per-location weighted average, transfer cost flow, HPP), Menu & Recipe (per-location items, modifier groups, BOM, recipe→deduction), POS (open/close bill, split-bill payment-vs-item gap, full/partial void with stock+journal reversal, cashier shift, table move/merge, discount/voucher, Moka import), Inventory (balance/movement, transfer status flow, opname location-lock, min-stock alert, receiving), Production (semi-finished items).
- **Known design tensions to press when their module comes up:** void reverses stock+journals but the atomicity foundation must exist first; transfer cost flow depends on movement ordering (transfer_out captures cost before transfer_in recomputes); opname blocks all movements at a location (concurrency claim); split-bill "by items" is described but the data model is payment-level only (design gap).
- **Cross-module contract shape** — how one module reaches another (port/use-case downward vs event), once the module standard and transaction model are settled.

## Out of scope

Ruled beyond this map's destination. Does not graduate; returns only as a separate effort if the destination is redrawn.

- **Finance module** (CoA, auto-journals, AP/AR, fiscal period, reports) — depends on correct core operations first; too heavy to grill in this effort.
- **HR module** (employees, shift templates, attendance, payroll).
- **CRM module** (customers, loyalty tiers/points, promotions).
- **Moka import** implementation detail — the Order model must accommodate `source`/`externalRef`, but the import pipeline itself is deferred.

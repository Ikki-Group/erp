# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal staff operating Ikki Group's F&B business (Ikki Coffee cafe, Ikki Resto restaurant, and central warehouses):

- **Owner** — multi-location/business overview, decision support.
- **Manager** — daily operations oversight.
- **Warehouse Staff** — receiving goods, fulfilling transfers, stock counts (opname).
- **Accountant** — financial reconciliation.

**Cashier** is a documented future persona (fast order entry, shift management) but is not currently active — see Capabilities and Constraints: POS is out of scope right now.

## Product Purpose

Ikki ERP is the internal operational system for Ikki Group, a single F&B business (not multi-tenant). It connects inventory, recipe-driven costing (HPP), and finance across multiple locations into one source of truth, replacing fragmented manual tracking and disconnected tools.

## Positioning

Real-time, location-scoped stock visibility and recipe-driven costing (HPP), unified across multiple store and warehouse locations under one business — in place of manual estimates and disconnected spreadsheets/tools.

## Operating Context

- **Location as the operational unit:** stores (Ikki Coffee, Ikki Resto) and central warehouses. Every record scopes to a location; a consolidated "all locations" view also exists for broader oversight.
- **Materials and recipes are global**, shared across locations; cost (HPP) and stock balances are per-location.
- **Roles and permissions scope by location** (IAM: Owner, Manager, Warehouse Staff, Accountant as system roles; custom roles are possible).
- **Audit everything:** who did what, when, tracked on every mutation.

## Capabilities and Constraints

- **Web-only, fully responsive across all device screen sizes** (phone, tablet, desktop) — this is an explicit target, not just a tablet-optimized or desktop-optimized surface.
- **POS is explicitly out of scope right now.** A POS module (orders, tables, shifts, vouchers) exists in the current codebase, but per the user it should be ignored as incumbent evidence — do not extend it or treat it as representative of current product direction unless told otherwise.
- **`docs/product/*.md` PRD documents are known to be stale/mismatched** with the actual current product direction (per the user). Treat them as unreliable background only; verify material claims against the user or current code before citing them as fact. `CONTEXT.md`'s domain glossary (root of repo) is actively maintained for an in-progress backend redesign and is comparatively more current, but still verify specifics rather than assuming.
- Single business, not multi-tenant SaaS: one company settings record (single tax rate, single currency — IDR).
- **Permissive stock principle:** sales/consumption never block on insufficient stock (a negative balance is a restock signal, not an error); transfer-out still requires sufficient stock.
- Existing frontend stack (already answers "Stack"): React 19, Vite, TanStack Router/Query/Table/Form, shadcn/ui on Base UI primitives, Tailwind v4.
- **Bahasa Indonesia** is the UI language and voice for staff-facing copy.
- The user has stated they are open to replacing anything in the current implementation — the incumbent code is a starting point, not a constraint to preserve for its own sake.
- **UI language direction revised**: primary language is **English for now**; the longer-term direction trends toward a mixed English/Indonesian voice (common in Indonesian tech-worker speech), not full Bahasa Indonesia. The codebase currently has a real, unresolved ~50/50 English/Indonesian split across production routes (flagged by two design critique rounds) — this is tracked as **copywriting backlog**, explicitly deferred. Do not do copy/wording/language-consistency passes unless specifically asked; structural UI/UX work takes priority.

## Brand Commitments

- Name: **Ikki ERP** (short form "Ikki"). Business: **Ikki Group**.
- **New logo** added at `apps/web/public/logo.png` (plus `logo-light.png`, `logo-dark.png`): a faceted, gradient "ik" mark in blue/cyan tones. This supersedes any prior/incumbent brand mark used in the UI (e.g., the generic `StoreIcon` placeholder currently on the login page).
- Voice: Bahasa Indonesia, direct and warm (e.g., existing login copy: "Masuk untuk mengelola bisnis Anda", "Ruang kerja Anda, satu sumber kebenaran").

## Evidence on Hand

- Real brand asset: `apps/web/public/logo.png`, `logo-light.png`, `logo-dark.png` — use these rather than a placeholder mark.
- No real customer/sales data, loyalty data, or financial reports exist yet. Do not fabricate metrics, testimonials, or sample data for future work; use genuinely empty/placeholder states instead.
- `docs/web/07-design-system.md` documents an existing "Warm Precision" design system in code. Visual maturity exists, but per the docs-mismatch caveat above, its accuracy against current code should be verified (e.g., via `$impeccable document`) before being treated as settled DESIGN.md-equivalent authority.

## Product Principles

1. Location is the operational unit — every record scopes to a location; a consolidated "all locations" view exists for broader oversight.
2. Materials and recipes are global; cost and stock are tracked per-location.
3. The system is the intended single source of truth, replacing fragmented manual tracking and disconnected tools.
4. Everything is audited — every mutation records who and when.
5. POS is explicitly out of scope for now — its existing code should not steer current design decisions.

## Accessibility & Inclusion

No formal accessibility standard has been established yet (explicitly deferred by the user). The one firm requirement is full responsiveness across all device screen sizes. Existing code shows baseline accessibility care (aria labels, keyboard-operable controls) — maintain at least that bar until a formal standard is set.

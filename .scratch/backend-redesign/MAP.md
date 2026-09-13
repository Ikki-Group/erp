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
- [F2 · Transaction & atomic-effect model](./tickets/F2-transaction-atomicity.md): hybrid rule — atomic effects sync in one UoW threading `tx`; non-critical effects as best-effort in-process events post-commit. One write = one UoW; cross-module atomic effects via `Api(tx)`, no nesting; no error-swallowing in UoW; mandatory in-UoW ordering. → `docs/adr/0002-transaction-atomic-effects.md`.
- [F3 · Money & quantity precision](./tickets/F3-money-precision.md): `Money`/`Qty` sole representation (raw-Decimal retired); precision table amount 0dp / cost 4dp / qty 6dp, full precision through calc + round once at boundary; UoM conversion applied in pure calculator; serialize as numeric string at HTTP. → `docs/adr/0003-money-precision.md`.
- [F5 · RBAC & permissions](./tickets/F5-rbac-permissions.md): permission format `<slice>.<action>` (dot, slice = smallest entity); domain verbs first-class; enforced by `rbac` macro on every route (closes P1); owner bypass + location-scoped assignments; PRD catalog + 5 roles adopted, rewritten, in-scope only. → `docs/adr/0004-rbac-permissions.md`.
- [F6 · Audit trail](./tickets/F6-audit.md): audit is atomic (in UoW, awaited, throws) — overrides PRD's async claim; action verbs align with RBAC vocabulary; `actorName` mandatory (closes P1); one user action = one entry; derived effects traced by their movement, not a second row. → `docs/adr/0005-audit-trail.md`.
- [F4 · Concurrency & permissive stock](./tickets/F4-concurrency.md): permissive/non-blocking for a small UMKM — negative stock allowed for sales (drop non-negative CHECK), transfer-out still checks, opname snapshot-based, one-active invariants via partial unique index. Revises ADR-0002 §4. → `docs/adr/0006-concurrency-permissive-stock.md`.

**■ Foundation complete (F1–F6). Domain layer graduated into tickets D0–D7 below.**

- [D0 · Auth & IAM](./tickets/D0-auth-iam.md): session behind memory-backed port; location switching client-side (location from request header, validated per request — revises ADR-0004 §4); per-user access map (global + per-location perms) materialized, cached, returned by `GET /me`; zero-DB per-request auth path (Postgres only on cache miss, one joined query); invalidation per-user + by-tag `role:{roleId}`. → `docs/adr/0007-auth-iam.md`.

## Not yet specified

The domain fog has graduated into tickets D0–D7 (see INDEX.md) now that the foundation is complete. Remaining fog:

- **Consolidation into a handoff spec** — once D0–D7 close, the ADRs + CONTEXT.md are collapsed into a spec for `/to-tickets`. This is the destination; it becomes specifiable when the domain tickets are done.
- **Design gaps flagged inside domain tickets** (to press when reached): split-bill by-items vs payment-level (D6); weightedAvgCost unsafe for negative qty (D3 FLAG #2); void reversal must be permissive (D5/D6 FLAG #1); journal event hook to avoid re-opening modules (D5/D6 FLAG #5); assignment-as-hard-constraint vs non-blocking principle (D2).

## Foundation-ADR review (2026-09-13)

Reviewed ADR-0001…0006 as a set. Outcome: foundation approved with fixes applied —
- Added **D0 · Auth & IAM** ticket: RBAC (ADR-0004) and audit actor (ADR-0005) depend on session/active-location/user-role, which had no domain ticket. D0 now blocks D1.
- Flagged into domain tickets: void-reversal permissive (D5/D6), weightedAvgCost negative-qty gap (D3), journal event hook (D5/D6).
- Cross-noted in ADRs: ADR-0006 adds void-reversal row; ADR-0002 journal row now specifies an event hook.
- ADR-0003 `toAmount()`/`toCost()` are target API (not yet in `money.ts`) — implementation-phase work, not an ADR defect.

## Out of scope

Ruled beyond this map's destination. Does not graduate; returns only as a separate effort if the destination is redrawn.

- **Finance module** (CoA, auto-journals, AP/AR, fiscal period, reports) — depends on correct core operations first; too heavy to grill in this effort.
- **HR module** (employees, shift templates, attendance, payroll).
- **CRM module** (customers, loyalty tiers/points, promotions).
- **Moka import** implementation detail — the Order model must accommodate `source`/`externalRef`, but the import pipeline itself is deferred.

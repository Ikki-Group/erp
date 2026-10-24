# 01: Foundation kernel + schema replace

**What to build:** The shared kernel and schema every module depends on, replaced to the new standard in one pass (no backward-compat). After this, `Money`/`Qty` are the only money types, module wiring is registry-only with static `Api`, sessions sit behind a port, and the schema matches the permissive/atomic model — so every later module is built on a clean base.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] `Money` exposes `toAmount()` (0dp) and `toCost()` (4dp); `Qty.toNumeric()` (6dp); the 2dp `toNumeric` is gone (ADR-0003).
- [x] UoM chain resolver refactored to a pure calculator over `Qty` (BFS retained); raw `Decimal`/`.toNumber()` removed from the domain/app path; `shared/utils/money.ts` retired (ADR-0003, 0009).
- [x] `SessionStore` port + memory (BentoCache) adapter (ADR-0007).
- [ ] Module wiring standard applied: infra from `ctx` only (no global-cache import), cross-module access via static `Api` (duck-typing helpers removed), starting with `menu.module.ts` (ADR-0001).
- [x] RBAC macro enforced-by-default + audit helper filling `actorName` from `Actor` (ADR-0004, 0005).
- [x] Schema migration: drop `stock_balances_qty_nonneg_chk`; add `production_in`/`production_out` movement types; partial unique indexes for one-open shift, one-active opname, one-open order per table; `document_sequences` atomic-upsert path (ADR-0006, 0008, 0011, 0014).
- [x] `bun run verify` + `bun run test` pass.

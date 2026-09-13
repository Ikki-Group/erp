# ADR-0008: Core Domain (Location, Company, Numbering)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0001 (module standard), ADR-0002 (transactions), ADR-0007 (auth — location scoping).
**Reviews:** the AI-generated `docs/product/02-prd-core.md` and `02-prd-core-numbering.md`.

## Context

Core is the base of the domain: **Location** (the operational unit everything scopes to), **Company** (singleton settings), and document **Numbering**. The PRDs describe these; this ADR presses them against the foundation decisions (permissive/non-blocking F4, reduce-DB F-layer, `Api`-only cross-module F1).

## Decision

### 1. Location: one entity, `type` drives capability (enforced server-side)

- One `Location` entity with `type ∈ {store, warehouse}`, unique immutable `code`.
- `store` has POS + inventory + menu; `warehouse` has inventory only.
- **Capability is enforced in the backend, not just the UI.** Pure `assert*` rules (per ADR-0001): creating an order or assigning a menu item to a `warehouse` is rejected (`assertIsStore`); inventory operations apply to both types. A `type` that were only a UI label would let direct API calls corrupt data.

### 2. Deactivation is blocked when stock exists (a destructive-admin exception to non-blocking)

- A location with `stock_balance.quantity != 0` cannot be deactivated (must transfer/adjust out first). At least one active store must always exist.
- This is **consistent with F4's non-blocking principle**, not a violation of it: F4's "don't nag the user" applies to a cashier's daily flow. Deactivating a location that still holds stock is a destructive admin action that would orphan stock history — blocking it is correct, exactly as transfer-out still checks stock (ADR-0006).

### 3. Numbering: atomic counter row, no race

- Format `{PREFIX}-{LOCATION_CODE}-{YYYYMMDD}-{SEQ}` (SEQ zero-padded 3 digits, extends to 4 past 999), daily reset per location per document type. Date component in **Asia/Jakarta (WIB)**. Numbers are immutable, never reused, generated at creation time.
- Sequence is produced by an **atomic upsert** on `document_sequences` (unique `(prefix, locationId, date)`):
  `INSERT ... ON CONFLICT (prefix, locationId, date) DO UPDATE SET seq = seq + 1 RETURNING seq`.
  One statement — no race, no retry loop, and one DB round-trip instead of SELECT MAX + INSERT (honours the reduce-DB constraint).
- Generation runs **inside the creating operation's UoW** (ADR-0002), so a rolled-back document does not leak a consumed number gap beyond what daily reset tolerates.
- Payroll's monthly `{PREFIX}-{LOC}-{YYYYMM}-{SEQ}` variant is noted but out of scope (HR deferred).

### 4. Company: singleton, single company-wide tax rate

- `Company` is a singleton settings record; only `company.update` (Owner default, ADR-0004) may change it.
- **Tax rate is a single company-wide value** (not per-location) — simplest for a single business; a per-location rate would be a localized change later if ever needed. POS consumes it downward via `CompanyApi.getTaxRate()` (`Api`-only, ADR-0001).
- Currency is IDR. The PRD's "currency locked after the first posted financial transaction" is **recorded but not enforced now** (Finance is out of scope; no journals are posted in this map). Currency is effectively constant.

## Alternatives Considered

- **`type` as a UI-only label.** Rejected: direct API calls could create orders at a warehouse; capability must be enforced server-side.
- **Per-location tax rate.** Rejected for now: single business, single rate is simpler; revisit only if a real need appears.
- **`SELECT MAX(seq)+1` for numbering.** Rejected: races under concurrent creation and costs an extra round-trip; the atomic upsert is race-free and cheaper.

## Consequences

- **Easier:** location capability is guaranteed by the backend; numbering is race-free and cheap; tax is one value POS reads through an `Api`.
- **Harder:** deactivation and capability checks add asserts, and numbering must run inside the UoW. Both are mechanical.
- **Constraint:** `type` capability enforced by rules; deactivation blocked on non-zero stock; numbers via atomic upsert inside the UoW, Asia/Jakarta date; company singleton with a single tax rate consumed via `Api`.

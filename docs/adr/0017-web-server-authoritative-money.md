# ADR-0017: The Web Client Never Recomputes Money

**Status:** Accepted
**Date:** 2026-09-14
**Depends on:** ADR-0003 (money precision — `Money`/`Qty` value objects, exact decimal arithmetic), ADR-0013 (POS domain — order totals).
**Scope:** `apps/web` (POS order screens); the server order totals contract.

## Context

The POS order server is authoritative for money. `apps/server/src/modules/pos/order/order.service.ts` calls `calculateOrderTotals({ lineTotals, discountAmount, taxRate })` on every mutation that can change an order's money (`linesSync`, `voucherApply`, `voucherRemove`), sourcing the tax rate itself via `#getTaxRate()` (company settings) and persisting `subtotal`/`discountAmount`/`taxAmount`/`total` onto the order. Those values are returned on the order detail.

Despite that, the web new-order screen (`apps/web/src/routes/_authenticated/pos/new-order.tsx`) carried its own money math: a hard-coded `const TAX_RATE = 0.11` and a client-side `subtotal`/`taxAmount`/`total` computation over the in-memory cart, using JS `number`.

This is two problems at once. First, a **second source of truth** for money that can silently drift from the server (a company tax-rate change, a rounding-rule difference, a discount-ordering difference — any of these makes the number the cashier sees disagree with the number the server records). Second, it violates the money-precision boundary from ADR-0003: money math in `number` instead of the exact-decimal `Money` value object, on the client.

## Decision

**The web client never computes a monetary amount. It only displays amounts the server produced.**

- The new-order screen displays the server-returned order totals (`subtotal`/`discountAmount`/`taxAmount`/`total` from the synced order / order detail), not a locally-computed total.
- The hard-coded `TAX_RATE` and all client-side total/tax arithmetic are **deleted** (no backward-compat shim, no fallback path).
- Before the first server sync of a new cart, the displayed total is shown as pending rather than estimated on the client. Line syncing drives the authoritative total; the UI reflects sync state.
- This applies to tax specifically and to money generally: discounts, voucher effects, and grand totals are all read from the server, never recomputed on the client.

A per-line unit price shown while browsing the menu (a catalog price, straight from the menu-item DTO) is not a *computed* amount and is fine to display; the rule bans client-side *arithmetic that produces an order's money*, not the rendering of a server-provided price.

## Consequences

- **No drift.** The cashier's total is, by construction, the total the server will record. Changing the company tax rate changes every screen at once, because there is one source.
- **Smaller client.** The change is a net deletion — cart math and a magic constant go away.
- **A sync cadence dependency.** The displayed total now depends on line-sync round-trips, so the UI must have an honest pending state for an unsynced cart rather than showing a stale or guessed number. This is the real trade-off: instantaneous local estimation is given up for correctness.
- **Guardrail for the future.** Without this ADR the obvious "quick fix" for a laggy total is to recompute on the client — which silently reintroduces the drift. This decision is the reason not to.

## Alternatives considered

- **Source `company.taxRate` on the client and recompute locally.** Removes the hard-coded constant but keeps a second computation path (and keeps money math in `number`), so drift and the ADR-0003 violation remain. Rejected.
- **Keep client estimation as an optimistic pre-sync total.** Optimistic UI for money invites exactly the mismatch this ADR exists to prevent; an honest pending state is preferred over a confident wrong number. Rejected.

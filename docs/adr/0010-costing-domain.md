# ADR-0010: Costing Domain (per-location weighted average, transfer cost, HPP)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0003 (Money/Qty), ADR-0006 (permissive stock), ADR-0009 (master data).
**Reviews:** the AI-generated `docs/product/03-prd-master-data-costing.md`. **Closes:** D3 FLAG #2 (weighted-average unsafe for negative qty).

## Context

Cost is tracked per location on `stock_balances.cost_price` (base UoM), recalculated by weighted average on receiving and transfer-received. HPP (COGS) is derived from the location's cost. The existing `weightedAvgCost` (`shared/domain/costing.ts`) only guards `totalQty.isZero()`. Under permissive stock (ADR-0006) `oldQty` can be **negative**, which makes the full formula produce nonsensical or negative costs — the gap this ADR closes.

## Decision

### 1. Weighted average is only meaningful when `oldQty > 0`

- **`oldQty > 0`:** `newCost = (oldQty×oldCost + inQty×inCost) / (oldQty + inQty)` (full weighted average).
- **`oldQty <= 0`:** ignore the old cost — `newCost = incoming unit cost`. When on-hand is zero or negative there is no physical stock whose cost applies, so the next receipt resets cost to the actual purchase price.
- This keeps cost always sensible (never negative, never divide-by-near-zero) and is easy to explain: a negative balance is a stock debt; the next receipt prices at what was actually paid.

### 2. `cost_price` changes only on inbound cost events

- `cost_price` is updated **only** on receiving and transfer-received (via §1). It is **never** changed by a sale, a void, a manual adjustment, or an opname — those change quantity only.
- Therefore `cost_price` holds the **last known cost** even while `quantity` is negative.

### 3. HPP uses the location's last known cost

- HPP for an order line = the location's `stock_balances.cost_price` for each recipe material × the recipe usage (converted to base UoM via the pure UoM resolver, ADR-0009), summed, divided by recipe yield, times order-line quantity — all at full `Money`/`Qty` precision, rounded once at the boundary (ADR-0003).
- When stock is negative, HPP still uses the last known `cost_price` (ADR-0006) — there is always a sensible number.
- **Material with no cost history:** a material just assigned to a location has `cost_price = 0` until its first receiving/transfer-in/production. If it is sold before then, its HPP contribution is **0** — an accepted state, not an error. The first inbound event sets a real cost (per §1), and subsequent HPP reflects it. This is surfaced (a zero-cost sale is an anomaly to notice), not blocked.

### 4. Transfer cost flow (atomic, ordered, one UoW)

Transfer-received is one atomic operation (ADR-0002). Order matters:

1. Read the source location's `cost_price`.
2. Record `transfer_out` movement carrying that `source_cost`, and reduce source stock. Transfer-out **still checks sufficient stock** (ADR-0006) — it may not go negative.
3. At the destination, weighted-average using `source_cost` as the incoming unit cost (subject to §1: if destination `oldQty <= 0`, destination cost becomes `source_cost`), and add stock. Adding stock at the destination is permissive and never fails.

Transfer does not change the source's cost — only quantity leaves; cost stays.

## Alternatives Considered

- **Keep the full weighted-average formula for negative `oldQty`.** Rejected: yields negative or nonsensical costs; accounting "debt absorption" is not worth the confusion for a small UMKM.
- **Zero out `cost_price` when stock goes negative.** Rejected: destroys the last known cost needed for HPP; ADR-0006 requires HPP to use last known cost.

## Consequences

- **Easier:** cost is always a sensible number; the negative-stock edge is handled by one clear rule; HPP always computable.
- **Harder:** the `oldQty <= 0` branch must be in the pure `weightedAvgCost` calculator and unit-tested (including negative and zero inputs).
- **Constraint:** `cost_price` changes only on receiving/transfer-received; weighted average resets to incoming cost when `oldQty <= 0`; HPP uses last known cost; transfer cost flow follows the ordered atomic sequence.

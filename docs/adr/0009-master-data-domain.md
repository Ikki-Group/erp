# ADR-0009: Master Data Domain (Material, UoM chain, Supplier, location assignment)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0001 (module standard), ADR-0003 (Money/Qty), ADR-0006 (permissive stock), ADR-0008 (core).
**Reviews:** the AI-generated `docs/product/03-prd-master-data.md`.

## Context

Master Data holds the **global Material catalog**, the **UoM chain-conversion** system, and **Suppliers**, plus the material→location **assignment** that controls where a material may exist. The key tension: the PRD describes assignment as a *hard constraint* that rejects operations, which appears to clash with the permissive/non-blocking principle (ADR-0006). The existing UoM resolver (BFS multi-hop, forward/inverse) is sound but uses raw `Decimal` and a lossy `.toNumber()` format, violating ADR-0003.

## Decision

### 1. Material→location assignment: hard constraint for warehouse ops, permissive for sales

- A material must be **assigned** to a location to be **received**, **transferred to/from**, or hold a managed stock record there. Removing an assignment is blocked while stock ≠ 0 at that location.
- This is **not** a violation of non-blocking (ADR-0006): assignment says "this material does not belong at this location" (e.g. coffee beans at a packaging warehouse). Receiving/transferring an unassigned material is a data error, like transfer-out or location deactivation.
- **Exception — POS sale deduction is permissive:** if a recipe consumes a material not assigned at the selling store, the sale is **not blocked**. The stock movement is still recorded (may go negative, per ADR-0006) and surfaces as an anomaly to fix in setup. Never block the cashier over a setup gap.

| Operation | Unassigned material |
| --- | --- |
| Receiving | Rejected (assign first) |
| Transfer in/out | Rejected |
| Remove assignment with stock ≠ 0 | Rejected |
| **POS sale deduction** | **Allowed** — records movement, never blocks |

### 2. UoM chain resolver: pure calculator over `Qty`

- The resolver stays a pure calculator (ADR-0001) with the existing BFS graph (forward edges + inverse edges, `MAX_CONVERSION_HOPS`), but its arithmetic operates on **`Qty`** (ADR-0003) at full precision. The lossy `formatDecimal(... .toNumber())` and the raw-`Decimal` import are removed; input and output are `Qty`.
- Rules: conversions only within the same category (weight↔weight, …); factor > 0; if no path exists, an explicit error; system UoMs (kg, g, L, ml, pcs) cannot be deleted; custom UoMs allowed.

### 3. Material model

- Global catalog, `code` globally unique, soft-delete; cannot delete/deactivate while stock ≠ 0 anywhere (consistent with ADR-0008 location rule).
- `baseUomId` is the source of truth for stock balance. `defaultPurchaseUomId` / `defaultStockUomId` / `defaultRecipeUomId` are optional UI hints that fall back to base and **must be convertible to base** via the chain (validated when set).
- `type ∈ {raw, semi_finished}`; `semi_finished` marks a material produced internally (Production, D7). `minStock` is an all-locations threshold (base UoM) driving alerts (event, per ADR-0002).
- `cost_price` is not on Material — it is per-location on `stock_balances` (ADR-0003 / costing D3).

### 4. Supplier

- Reference data: contact, `paymentTerms` (credit days). Soft-delete to preserve purchase history.
- Supplier-material price is **reference only** (actual PO/receiving price can differ). `paymentTerms` will drive AP due dates when Finance is built (out of scope; recorded).

## Alternatives Considered

- **Assignment as a soft hint (never rejects).** Rejected: receiving/transferring an unassigned material corrupts location data; the hard constraint belongs on warehouse ops.
- **Block POS sales on unassigned material.** Rejected: blocks the cashier over a setup gap — violates ADR-0006.
- **Keep the raw-Decimal UoM resolver.** Rejected: violates ADR-0003 (bare Decimal, lossy `.toNumber()`); refactor to `Qty`.

## Consequences

- **Easier:** warehouse data stays clean (assignment enforced); sales never blocked by setup gaps; UoM math is precise and pure.
- **Harder:** the assignment check must be threaded into receiving/transfer use-cases; the resolver refactor to `Qty` is implementation work.
- **Constraint:** assignment is a hard constraint for receiving/transfer only; POS deduction is permissive; the UoM resolver is a pure `Qty` calculator; Material has no cost field.

# F3 · Money & quantity precision model

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F1 ✅

## Resolution (2026-09-13)

**Decision:** `Money`/`Qty` value objects are the only representation of currency/quantity; raw-Decimal path retired. Definitive precision table: amount 0dp (IDR no subunit), unit cost 4dp, qty/factor 6dp; full precision through calc, round once at boundary. Full decision in [`docs/adr/0003-money-precision.md`](../../../docs/adr/0003-money-precision.md).

Settled Q1–Q5:
- Q1: ratify Money/Qty as sole path; kill parallel raw-Decimal helpers (`utils/money.ts`); `costing.ts` weightedAvgCost canonical.
- Q2: precision table — amount 0dp, cost 4dp, qty 6dp, HALF_UP; `Money.toAmount()` vs `toCost()`. IDR confirmed 0 decimals.
- Q3: full precision through calculations, round once at persist/response boundary.
- Q4: UoM conversion — fetch factor via repo, apply in pure calculator taking Qty; calculator never touches DB.
- Q5: serialize Money/Qty as numeric string in HTTP responses (DTO `zp.str`); never leak the type past a boundary.

## Question

How are money and quantities represented, rounded, and converted across the domain?

Press: Money/Qty value objects (decimal.js) vs alternatives; where construction happens (boundary in, numeric-string out); rounding rules (currency vs qty precision); how UoM conversion factors interact with money in costing/HPP without precision loss. This fixes the `Number(string)` leak throughout POS. Output: an ADR defining Money/Qty and the rounding/conversion discipline.

## Notes

- Live P2: POS totals round-trip through `Number(string)`.
- Costing (per-location weighted avg) and HPP depend heavily on this — get it right before those domain tickets.
- Old ADR-0005 is raw material.

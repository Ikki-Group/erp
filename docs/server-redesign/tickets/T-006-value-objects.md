# T-006: `Money` + `Qty` + `weightedAvgCost`

**Tracker row:** P0.6
**Depends on:** —
**Type:** foundation

## Goal
`shared/domain/money.ts`, `shared/domain/qty.ts`, `shared/domain/costing.ts` provide the value objects and the weighted-average-cost helper.

## Read first
- [04-value-objects.md](../04-value-objects.md)

## Build
1. `shared/domain/money.ts` — `Money` class exactly as spec 04 §1 (`of`, `zero`, `add`, `sub`, `mul`, `percent`, comparisons, `toNumeric`, `toNumber`, `toDecimal`). Configure `Decimal` HALF_UP.
2. `shared/domain/qty.ts` — `Qty` class as spec 04 §2 (incl. safe-zero `div`).
3. `shared/domain/costing.ts` — `weightedAvgCost(Qty, Money, Qty, Money)` as spec 04 §3.

## Definition of done
- Unit tests (no DB): `Money.of('0.1').add(Money.of('0.2')).toNumeric() === '0.30'`; `Qty.of('1').div(Qty.zero()).isZero()`; `weightedAvgCost` matches a hand-computed example.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
These replace `shared/utils/money.ts` `Number()`-based helpers. Do NOT expose a `number` for money in domain/app. Keep the existing `decimal.js` dependency.

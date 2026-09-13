# ADR-0003: Money & Quantity Precision Model

**Status:** Accepted
**Date:** 2026-09-13
**Supersedes:** archived `ADR-0005-money-qty-value-objects.md` (re-grilled and extended with a definitive precision table).
**Depends on:** ADR-0001 (module standard — pure calculators).

## Context

Money and quantities are stored as `numeric` strings in the DB. `Money`/`Qty` value objects already exist (`apps/server/src/shared/domain/money.ts`, `qty.ts`, `costing.ts`) and are used by migrated modules. But a **parallel raw-Decimal path** still lives in `apps/server/src/shared/utils/money.ts` and is used by the un-migrated `inventory/stock` and `pos/order` code, which also does `Number(order.total)` / `String(totals.subtotal)` — the live precision leak. `weightedAvgCost` is duplicated in both files with different signatures (Money/Qty vs raw Decimal).

There is also no single precision rule: `Money.toNumeric()` rounds to 2dp, `Money.toNumber()` to 0dp, `roundPrice` to 0dp, `roundCost` to 4dp, `roundQty` to 6dp — inconsistent for the same currency.

## Decision

### 1. `Money`/`Qty` are the only representation

- In `domain`/`app` layers: currency is `Money`, quantity/factor is `Qty`.
- A JS `number` for a monetary amount, and a bare `new Decimal(...)`, are **forbidden** in domain/app. `decimal.js` lives **only inside** the `Money`/`Qty` implementations.
- The raw-Decimal helpers in `shared/utils/money.ts` are removed from the domain/app path as each module migrates. The canonical `weightedAvgCost` is the `Money`/`Qty` version in `shared/domain/costing.ts`; the raw-Decimal duplicate is deleted.

### 2. Definitive precision table

| Kind | Examples | Stored precision | Rounding |
| --- | --- | --- | --- |
| **Amount** (currency) | subtotal, total, price, payment, discount, tax | **0 dp** — IDR has no subunit | HALF_UP at persist boundary |
| **Unit cost** | `stock_balances.cost_price` (weighted average, per unit) | **4 dp** | HALF_UP |
| **Quantity / factor** | stock qty, UoM conversion factor, recipe qty, yield | **6 dp** | HALF_UP |

`Money` exposes distinct serializers for its two roles:
- `toAmount()` → 0 dp string (totals, prices, payments)
- `toCost()` → 4 dp string (unit cost)

`Qty.toNumeric()` → 6 dp string.

> The current `Money.toNumeric()` (2 dp) is wrong for both roles and is replaced by `toAmount()`/`toCost()`.

### 3. Full precision through calculations; round once at the boundary

- Calculations run at full internal precision (decimal.js 30 dp). **Never round in the middle** of a calculation chain.
- Rounding happens exactly once, at a boundary: when persisting (`toAmount`/`toCost`/`toNumeric`) or serializing an HTTP response.
- This is what makes HPP correct: cost × qty × conversion factor, summed, divided by yield — all full precision, rounded only at the end.

### 4. UoM conversion stays pure

- Conversion factors are **fetched via the repo** (I/O), then **applied in a pure calculator** that operates on `Qty`/`Money` at full precision.
- The calculator receives the conversion factor as a `Qty` parameter; it never looks up the DB. (Matches the existing `uom/domain/uom.resolver.ts` shape: fetch conversions in the repo, resolve purely.)

### 5. Serialization boundaries

- **In:** construct `Money.of(...)` / `Qty.of(...)` from a DB `numeric` string or validated input, at the repo mapper or the start of the service.
- **Persist:** serialize with `toAmount()` / `toCost()` / `toNumeric()` (string) in the repo.
- **HTTP response:** serialize as a `numeric` **string** (not a JS number), so precision is preserved to the frontend, which decides display formatting. Money DTO fields stay `zp.str`.
- `Money`/`Qty` never leak as a type past a boundary — always a string at HTTP.

## Alternatives Considered

- **Keep raw-Decimal helpers, enforce by review.** Rejected: relies on remembering not to call `Number()` — exactly what fails today.
- **Store money as integer minor units (cents).** Rejected: IDR has no subunit; schema uses `numeric`; a units migration is larger than warranted.
- **A separate `Cost` value type distinct from `Money`.** Rejected: adds a type; two serializer methods (`toAmount`/`toCost`) on `Money` cover the two precision roles without it.

## Consequences

- **Easier:** one amount type end-to-end; precision rules live in the value object; HPP accumulation error disappears.
- **Harder:** boundary construction/serialization must be explicit; the two serializers must be used for the right role. Enforced by unit tests on calculators and by review.
- **Constraint:** no `Number(numericString)`, no bare `Decimal`, no mid-chain rounding in domain/app. The raw-Decimal helper file is retired as modules migrate.

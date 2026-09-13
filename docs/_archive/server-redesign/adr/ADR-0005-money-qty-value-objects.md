# ADR-0005: Money and Qty Value Objects

**Status:** Accepted
**Date:** 2026-09-05

## Context

Money exists as `numeric` strings in the DB and as `decimal.js` in `shared/utils/money.ts`, but services routinely convert to JS `number` (`Number(order.subtotal)`, `Number(l.lineTotal)`) to do arithmetic, then back to strings. Each `Number()` on a `numeric` string risks precision loss and every conversion is a place a bug can hide. There is no single type that represents "an amount" through the whole flow.

## Decision

Introduce two domain value objects:

- **`Money`** — wraps an exact decimal amount (backed by `decimal.js`), for currency amounts (IDR, integer rounding at the boundary).
- **`Qty`** — wraps a high-precision quantity/factor (6 dp), for stock and recipe math.

Rules:
- Constructed once at the boundary (from a DB `numeric` string or a validated input).
- All arithmetic happens on the value object inside the domain layer.
- Converted to a `numeric` string only when persisting, and to a display number only at the HTTP response boundary.
- A JS `number` for a monetary amount is **forbidden** inside domain and app layers.

## Alternatives Considered

- **Keep `decimal.js` helpers, discipline via review.** Rejected: relies on the implementer remembering not to call `Number()` — exactly what fails today.
- **Store money as integer minor units (cents).** Rejected: IDR has no subunit in practice and existing schema uses `numeric`; a units migration is a larger change than warranted.

## Consequences

- **Easier:** one type carries an amount end-to-end; precision rules live in the value object, not scattered across services. The implementer uses `Money.of(...)`, `.add()`, `.mul()`, `.toNumeric()` and never touches raw arithmetic.
- **Harder:** boundary conversions must be explicit. Mitigated: the golden-path template shows exactly where to construct and serialize.
- **Constraint:** `Money`/`Qty` live in a shared domain module and are imported by module `domain` layers. The exact API is specified in Stage 2's value-object spec.

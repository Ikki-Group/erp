# Money & Qty Value Objects Spec

Exact-precision amounts through the whole flow. Implements ADR-0005. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> A monetary amount is a `Money`, a quantity/factor is a `Qty`, from the moment it enters the domain until it is serialized to persist or respond. A JS `number` for money inside `domain`/`app` is forbidden.

## 1. `Money` (shared/domain/money.ts)

Backed by `decimal.js`. IDR — integer rounding at the boundary (ROUND_HALF_UP). Stored as `numeric(18,2)` string.

```ts
import Decimal from 'decimal.js'

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP })

export class Money {
  private constructor(private readonly d: Decimal) {}

  /** Construct from a DB numeric string, a validated input number, or another Decimal-ish. */
  static of(v: string | number): Money { return new Money(new Decimal(v)) }
  static zero(): Money { return new Money(new Decimal(0)) }

  add(o: Money): Money { return new Money(this.d.plus(o.d)) }
  sub(o: Money): Money { return new Money(this.d.minus(o.d)) }
  mul(factor: Qty | number | string): Money {
    const f = factor instanceof Qty ? factor.toDecimal() : new Decimal(factor)
    return new Money(this.d.times(f))
  }
  /** Percentage helper: amount.percent(11) = 11% of amount. */
  percent(p: number | string): Money { return new Money(this.d.times(new Decimal(p).div(100))) }

  isZero(): boolean { return this.d.isZero() }
  gt(o: Money): boolean { return this.d.greaterThan(o.d) }
  gte(o: Money): boolean { return this.d.greaterThanOrEqualTo(o.d) }

  /** For persistence: numeric(18,2) string. */
  toNumeric(): string { return this.d.toDecimalPlaces(2).toFixed(2) }
  /** For HTTP response only (rounded IDR, no subunit). */
  toNumber(): number { return this.d.toDecimalPlaces(0).toNumber() }
  /** Escape hatch for the rare raw-decimal need. */
  toDecimal(): Decimal { return this.d }
}
```

## 2. `Qty` (shared/domain/qty.ts)

High precision (6 dp) for stock/recipe/UoM math. Stored as `numeric(18,6)` string.

```ts
import Decimal from 'decimal.js'

export class Qty {
  private constructor(private readonly d: Decimal) {}

  static of(v: string | number): Qty { return new Qty(new Decimal(v)) }
  static zero(): Qty { return new Qty(new Decimal(0)) }

  add(o: Qty): Qty { return new Qty(this.d.plus(o.d)) }
  sub(o: Qty): Qty { return new Qty(this.d.minus(o.d)) }
  mul(o: Qty | number | string): Qty {
    const f = o instanceof Qty ? o.toDecimal() : new Decimal(o)
    return new Qty(this.d.times(f))
  }
  /** Safe divide — returns Qty.zero() when the divisor is zero (never throws). */
  div(o: Qty | number | string): Qty {
    const dv = o instanceof Qty ? o.toDecimal() : new Decimal(o)
    if (dv.isZero()) return Qty.zero()
    return new Qty(this.d.div(dv))
  }

  isZero(): boolean { return this.d.isZero() }
  lt(o: Qty): boolean { return this.d.lessThan(o.d) }
  gte(o: Qty): boolean { return this.d.greaterThanOrEqualTo(o.d) }

  /** For persistence: numeric(18,6) string. */
  toNumeric(): string { return this.d.toDecimalPlaces(6).toFixed(6) }
  toDecimal(): Decimal { return this.d }
}
```

## 3. Weighted-average cost (domain helper)

Ports the current `weightedAvgCost` into value-object form (used by inventory stock).

```ts
// shared/domain/costing.ts
export function weightedAvgCost(oldQty: Qty, oldCost: Money, inQty: Qty, inCost: Money): Money {
  const totalQty = oldQty.add(inQty)
  if (totalQty.isZero()) return Money.zero()
  // ((oldQty*oldCost) + (inQty*inCost)) / totalQty
  const numerator = oldCost.mul(oldQty).add(inCost.mul(inQty))
  return Money.of(numerator.toDecimal().div(totalQty.toDecimal()).toString())
}
```

## 4. Where conversion happens (the only two boundaries)

| Boundary | Direction | Call |
| --- | --- | --- |
| Repo read → domain | string → VO | `Money.of(row.total)`, `Qty.of(row.quantity)` |
| Domain → repo write | VO → string | `total.toNumeric()`, `qty.toNumeric()` |
| Domain → HTTP response | VO → number/string | `total.toNumber()` (or keep numeric string in DTO) |
| HTTP input → domain | validated number/string → VO | `Money.of(input.amount)` |

Inside `domain` and `app`, values stay as `Money`/`Qty`. No `Number(someString)`.

## 5. Hard rules

- Construct a VO **once** at the read/input boundary; serialize **once** at the write/response boundary.
- `Money` for currency, `Qty` for quantities/factors — do not mix (compile-time distinct types).
- Division uses `Qty.div` (safe-zero) — never raw `/` on decimals for quantities.
- Rounding lives in `toNumeric`/`toNumber` — do not round mid-calculation.

## 6. Anti-patterns

```ts
const subtotal = Number(order.subtotal)                 // ❌ leaks money as a JS number (the current pattern)
const total = subtotal + tax                            // ❌ float arithmetic on money
await repo.update(id, { total: String(subtotal + tax) })// ❌ string math

// ✅
const subtotal = Money.of(order.subtotal)
const total = subtotal.add(tax)
await repo.update(id, { total: total.toNumeric() }, tx)
```

---

**Next:** [05-cache-port.md](./05-cache-port.md)

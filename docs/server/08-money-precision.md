# Money & Decimal Precision

Rules for monetary arithmetic in the Ikki server — how to avoid floating-point errors.

## The Problem

Native JS `number` (IEEE 754 double) has precision issues with money:

```ts
0.1 + 0.2 === 0.30000000000000004  // classic
19.99 * 100 === 1998.9999999999998  // real money bug
```

Over time, weighted average cost calculations and UoM conversions accumulate drift, leading to incorrect inventory valuations.

## Solution

All cost/conversion arithmetic uses `decimal.js` via shared helpers. Prices (integer IDR) use native `number` safely.

## Shared Utilities

```ts
import {
  Decimal,
  toDecimal,
  roundPrice,
  roundCost,
  roundQty,
  weightedAvgCost,
  safeDivide,
} from '@/shared/utils/money.ts'
```

| Helper | Purpose | Returns |
|--------|---------|---------|
| `toDecimal(v)` | Parse string/number to Decimal | `Decimal` |
| `roundPrice(d)` | Round to integer (IDR, no subunit) | `number` |
| `roundCost(d)` | Round to 4dp (cost precision) | `string` (for DB) |
| `roundQty(d)` | Round to 6dp (quantity/factor) | `string` |
| `weightedAvgCost(oldQty, oldCost, inQty, inCost)` | Weighted average formula | `Decimal` |
| `safeDivide(num, div)` | Division with zero-guard | `Decimal` |

## Domain Rules

| Domain | Type | Precision | Example | Zod |
|--------|------|-----------|---------|-----|
| Menu price, order total, payment | `number` (integer) | 0 dp | `25000` | `z.coerce.number().int().min(0)` |
| Cost price (weighted avg) | `Decimal` → `string` | 4 dp | `"5333.3333"` | `z.string()` |
| UoM conversion factor | `Decimal` | 6 dp | `"0.083333"` | `z.string()` |
| Tax amount (final) | `roundPrice(decimal)` | Rounded once | `4400` | `z.number().int()` |

## Patterns

### Weighted Average Cost (stock receiving)

```ts
const newCost = weightedAvgCost(
  toDecimal(balance.qty),
  toDecimal(balance.costPrice),
  toDecimal(input.qty),
  toDecimal(input.unitCost),
)
const costForDb = roundCost(newCost) // "5333.3333"
```

### UoM Cost Conversion (receiving)

```ts
// 1 karton @ Rp120.000, conversion factor = 12 (1 karton = 12 pcs)
const baseUnitCost = safeDivide(toDecimal(lineCost), toDecimal(factor))
const costForDb = roundCost(baseUnitCost) // "10000.0000"
```

### Tax Calculation (order)

```ts
const taxableAmount = toDecimal(subtotal - discountAmount)
const taxDecimal = taxableAmount.mul(toDecimal(taxRate)).div(100)
const taxAmount = roundPrice(taxDecimal) // 4400 (integer IDR)
```

### Production Absorbed Costing

```ts
const totalInputCost = inputs.reduce(
  (sum, i) => sum.add(toDecimal(i.qty).mul(toDecimal(i.costPrice))),
  new Decimal(0),
)
const outputUnitCost = safeDivide(totalInputCost, toDecimal(outputQty))
const costForDb = roundCost(outputUnitCost) // "75000.0000"
```

## Anti-Patterns

| Don't | Why | Do instead |
|-------|-----|-----------|
| `parseFloat(costPrice)` | Loses precision | `toDecimal(costPrice)` |
| `price * 1.11` for tax | Float multiplication | `toDecimal(price).mul(taxRate).div(100)` |
| Round in intermediate steps | Compounds rounding error | Round once at final boundary |
| Store cost as `number` in code | Precision drift | Keep as `Decimal` until DB write |
| `Number(costString)` | Same as parseFloat | `toDecimal(costString)` |

## DB Column Types

Drizzle returns `numeric` columns as `string` — this is correct and intentional. Never parse to number.

```ts
// Schema
costPrice: numeric('cost_price', { precision: 15, scale: 4 })

// In repo: returned as string "5333.3333"
// In service: toDecimal(row.costPrice) for arithmetic
// Back to DB: roundCost(result) → "5333.3333"
```

## Configuration

```ts
// In money.ts
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })
```

- 20 significant digits — more than enough for any IDR calculation
- ROUND_HALF_UP — standard financial rounding (0.5 rounds away from zero)

---

**Next:** [06-module-map.md](./06-module-map.md) — Module registry.

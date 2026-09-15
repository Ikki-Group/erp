import Decimal from 'decimal.js'

import { Qty } from './qty.ts'

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP })

export class Money {
	private constructor(private readonly d: Decimal) {}

	static of(v: string | number): Money {
		return new Money(new Decimal(v))
	}

	static zero(): Money {
		return new Money(new Decimal(0))
	}

	add(o: Money): Money {
		return new Money(this.d.plus(o.d))
	}

	sub(o: Money): Money {
		return new Money(this.d.minus(o.d))
	}

	mul(factor: Qty | number | string): Money {
		const f = factor instanceof Qty ? new Decimal(factor.toString()) : new Decimal(factor)
		return new Money(this.d.times(f))
	}

	div(divisor: Qty | number | string): Money {
		const d = divisor instanceof Qty ? new Decimal(divisor.toString()) : new Decimal(divisor)
		if (d.isZero()) return Money.zero()
		return new Money(this.d.div(d))
	}

	percent(p: number | string): Money {
		return new Money(this.d.times(new Decimal(p).div(100)))
	}

	isZero(): boolean {
		return this.d.isZero()
	}

	lt(o: Money): boolean {
		return this.d.lessThan(o.d)
	}

	gt(o: Money): boolean {
		return this.d.greaterThan(o.d)
	}

	gte(o: Money): boolean {
		return this.d.greaterThanOrEqualTo(o.d)
	}

	toAmount(): string {
		return this.d.toDecimalPlaces(0).toFixed(0)
	}

	toCost(): string {
		return this.d.toDecimalPlaces(4).toFixed(4)
	}

	toString(): string {
		return this.d.toString()
	}
}

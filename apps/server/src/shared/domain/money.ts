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
		const f = factor instanceof Qty ? factor.toDecimal() : new Decimal(factor)
		return new Money(this.d.times(f))
	}

	percent(p: number | string): Money {
		return new Money(this.d.times(new Decimal(p).div(100)))
	}

	isZero(): boolean {
		return this.d.isZero()
	}

	gt(o: Money): boolean {
		return this.d.greaterThan(o.d)
	}

	gte(o: Money): boolean {
		return this.d.greaterThanOrEqualTo(o.d)
	}

	toNumeric(): string {
		return this.d.toDecimalPlaces(2).toFixed(2)
	}

	toNumber(): number {
		return this.d.toDecimalPlaces(0).toNumber()
	}

	toDecimal(): Decimal {
		return this.d
	}
}

import Decimal from 'decimal.js'

export class Qty {
	private constructor(private readonly d: Decimal) {}

	static of(v: string | number): Qty {
		return new Qty(new Decimal(v))
	}

	static zero(): Qty {
		return new Qty(new Decimal(0))
	}

	add(o: Qty): Qty {
		return new Qty(this.d.plus(o.d))
	}

	sub(o: Qty): Qty {
		return new Qty(this.d.minus(o.d))
	}

	mul(o: Qty | number | string): Qty {
		const f = o instanceof Qty ? new Decimal(o.toString()) : new Decimal(o)
		return new Qty(this.d.times(f))
	}

	div(o: Qty | number | string): Qty {
		const divisor = o instanceof Qty ? new Decimal(o.toString()) : new Decimal(o)
		if (divisor.isZero()) return Qty.zero()
		return new Qty(this.d.div(divisor))
	}

	abs(): Qty {
		return new Qty(this.d.abs())
	}

	isZero(): boolean {
		return this.d.isZero()
	}

	lt(o: Qty): boolean {
		return this.d.lessThan(o.d)
	}

	lte(o: Qty): boolean {
		return this.d.lessThanOrEqualTo(o.d)
	}

	gt(o: Qty): boolean {
		return this.d.greaterThan(o.d)
	}

	gte(o: Qty): boolean {
		return this.d.greaterThanOrEqualTo(o.d)
	}

	eq(o: Qty): boolean {
		return this.d.equals(o.d)
	}

	toNumeric(): string {
		return this.d.toDecimalPlaces(6).toFixed(6)
	}

	toString(): string {
		return this.d.toString()
	}
}

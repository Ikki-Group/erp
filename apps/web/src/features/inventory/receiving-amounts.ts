interface DecimalAmount {
	units: bigint
	scale: number
}

function parseAmount(value: string): DecimalAmount | undefined {
	const canonical = value.trim()
	if (!/^\d+(\.\d+)?$/u.test(canonical)) return undefined
	const [whole, fraction = ''] = canonical.split('.')
	return { units: BigInt(`${whole}${fraction}`), scale: fraction.length }
}

function serializeAmount({ units, scale }: DecimalAmount): string {
	if (scale === 0) return units.toString()
	const digits = units.toString().padStart(scale + 1, '0')
	const fraction = digits.slice(-scale).replace(/0+$/u, '')
	const whole = digits.slice(0, -scale)
	return fraction ? `${whole}.${fraction}` : whole
}

/** Keep DTO decimal strings exact, including fractional quantities and large prices. */
export function calculateReceivingAmounts(lines: readonly { qty: string; unitCost: string }[]): {
	subtotals: (string | undefined)[]
	total: string | undefined
} {
	let total: DecimalAmount = { units: 0n, scale: 0 }
	let complete = true
	const subtotals = lines.map((line) => {
		const qty = parseAmount(line.qty)
		const cost = parseAmount(line.unitCost)
		if (!qty || !cost) {
			complete = false
			return undefined
		}
		const subtotal = { units: qty.units * cost.units, scale: qty.scale + cost.scale }
		const scale = Math.max(total.scale, subtotal.scale)
		total = {
			units:
				total.units * 10n ** BigInt(scale - total.scale) +
				subtotal.units * 10n ** BigInt(scale - subtotal.scale),
			scale,
		}
		return serializeAmount(subtotal)
	})
	return { subtotals, total: complete ? serializeAmount(total) : undefined }
}

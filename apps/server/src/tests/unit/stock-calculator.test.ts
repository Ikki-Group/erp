import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import { applyMovement, weightedAvgCost } from '@/modules/inventory/stock/stock.calculator.ts'

import { describe, expect, test } from 'bun:test'

const bal = (qty: string, cost: string) => ({ qty: Qty.of(qty), cost: Money.of(cost) })
const show = (b: ReturnType<typeof applyMovement>) =>
	b && { qty: b.qty.toNumeric(), cost: b.cost.toCost() }

describe('weightedAvgCost', () => {
	test('blends old and incoming cost by quantity', () => {
		expect(
			weightedAvgCost(Qty.of('100'), Money.of('5000'), Qty.of('50'), Money.of('6000')).toCost(),
		).toBe('5333.3333')
	})

	test('resets to incoming cost when old stock is zero or negative', () => {
		expect(
			weightedAvgCost(Qty.zero(), Money.of('1000'), Qty.of('5'), Money.of('6000')).toCost(),
		).toBe('6000.0000')
		expect(
			weightedAvgCost(Qty.of('-2'), Money.of('1000'), Qty.of('5'), Money.of('6000')).toCost(),
		).toBe('6000.0000')
	})

	test('returns zero for zero total quantity when old stock is positive', () => {
		expect(
			weightedAvgCost(Qty.of('1'), Money.of('5000'), Qty.of('-1'), Money.of('6000')).isZero(),
		).toBe(true)
	})
})

describe('applyMovement', () => {
	test('inbound purchase with positive on-hand blends cost', () => {
		const next = applyMovement(bal('100', '5000'), {
			type: 'purchase_receipt',
			direction: 'in',
			qty: Qty.of('50'),
			unitCost: Money.of('6000'),
		})
		expect(show(next)).toEqual({ qty: '150.000000', cost: '5333.3333' })
	})

	test('inbound transfer with on-hand <= 0 resets cost to incoming', () => {
		const next = applyMovement(bal('-3', '1000'), {
			type: 'transfer_in',
			direction: 'in',
			qty: Qty.of('5'),
			unitCost: Money.of('2500'),
		})
		expect(show(next)).toEqual({ qty: '2.000000', cost: '2500.0000' })
	})

	test('outbound sale may go negative and keeps cost (permissive)', () => {
		const next = applyMovement(bal('1', '4000'), {
			type: 'sales',
			direction: 'out',
			qty: Qty.of('3'),
		})
		expect(show(next)).toEqual({ qty: '-2.000000', cost: '4000.0000' })
	})

	test('transfer_out with insufficient stock is rejected', () => {
		expect(
			applyMovement(bal('2', '4000'), { type: 'transfer_out', direction: 'out', qty: Qty.of('3') }),
		).toBeUndefined()
	})

	test('transfer_out with exactly enough stock is allowed', () => {
		const next = applyMovement(bal('3', '4000'), {
			type: 'transfer_out',
			direction: 'out',
			qty: Qty.of('3'),
		})
		expect(show(next)).toEqual({ qty: '0.000000', cost: '4000.0000' })
	})

	test('adjustment_in and return_in change qty only, never cost', () => {
		for (const type of ['adjustment_in', 'return_in'] as const) {
			const next = applyMovement(bal('-1', '4000'), {
				type,
				direction: 'in',
				qty: Qty.of('5'),
				unitCost: Money.of('9999'),
			})
			expect(show(next)).toEqual({ qty: '4.000000', cost: '4000.0000' })
		}
	})
})

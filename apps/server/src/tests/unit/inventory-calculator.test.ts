import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

import { opnameAdjustment } from '@/modules/inventory/opname/opname.calculator.ts'
import { receivingTotal, toBaseUnits } from '@/modules/inventory/receiving/receiving.calculator.ts'
import {
	isFullyReceived,
	nextReceivedQty,
} from '@/modules/inventory/transfer/transfer.calculator.ts'

import { describe, expect, test } from 'bun:test'

describe('opnameAdjustment', () => {
	test('surplus becomes adjustment_in', () => {
		const adj = opnameAdjustment(Qty.of('10'), Qty.of('12.5'))
		expect(adj && { ...adj, qty: adj.qty.toNumeric() }).toEqual({
			type: 'adjustment_in',
			direction: 'in',
			qty: '2.500000',
		})
	})

	test('shortage becomes adjustment_out with a positive qty', () => {
		const adj = opnameAdjustment(Qty.of('-2'), Qty.of('-5'))
		expect(adj && { ...adj, qty: adj.qty.toNumeric() }).toEqual({
			type: 'adjustment_out',
			direction: 'out',
			qty: '3.000000',
		})
	})

	test('no variance means no movement', () => {
		expect(opnameAdjustment(Qty.of('4'), Qty.of('4.000'))).toBeUndefined()
	})
})

describe('toBaseUnits', () => {
	test('scales qty up and unit cost down by the factor, keeping line value', () => {
		const base = toBaseUnits(Qty.of('2'), Money.of('120000'), Qty.of('12'))
		expect(base.qty.toNumeric()).toBe('24.000000')
		expect(base.unitCost.toCost()).toBe('10000.0000')
	})
})

describe('receivingTotal', () => {
	test('sums quantity × unit cost across lines', () => {
		expect(
			receivingTotal([
				{ quantity: '2.500000', unitCost: '3000.0000' },
				{ quantity: '4', unitCost: '1250.5' },
			]),
		).toBe('12502')
		expect(receivingTotal([])).toBe('0')
	})
})

describe('transfer receipt', () => {
	test('accumulates partial receipts up to the requested qty', () => {
		expect(nextReceivedQty(Qty.of('10'), Qty.of('4'), Qty.of('6'))?.toNumeric()).toBe('10.000000')
		expect(nextReceivedQty(Qty.of('10'), Qty.of('4'), Qty.of('6.1'))).toBeUndefined()
	})

	test('is fully received only when every line reaches its requested qty', () => {
		expect(isFullyReceived([{ requestedQty: '5', receivedQty: '5' }])).toBe(true)
		expect(
			isFullyReceived([
				{ requestedQty: '5', receivedQty: '5' },
				{ requestedQty: '2', receivedQty: null },
			]),
		).toBe(false)
	})
})

/// <reference lib="es2024.promise" />
import { describe, expect, it } from 'vitest'

import { createWorkflowAction } from '@/components/shared/workflow-action'

import type { TransferDetailDto, TransferDto } from './dto/index.ts'
import {
	calculateRemainingReceiptLines,
	type TransferWorkflows,
	createTransferWorkflows,
	remainingTransferQty,
	type TransferWorkflowDeps,
} from './transfer-workflow.ts'

type Status = TransferDto['status']

function detail(status: Status, lines: TransferDetailDto['lines'] = []): TransferDetailDto {
	return {
		id: 7,
		transferNo: 'TRF-7',
		fromLocationId: 1,
		toLocationId: 2,
		status,
		notes: null,
		requestedBy: null,
		lines,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		createdBy: 1,
		updatedBy: 1,
	}
}

function line(materialId: number, requestedQty: string, receivedQty: string | null) {
	return {
		id: materialId,
		transferId: 7,
		materialId,
		requestedQty,
		shippedQty: requestedQty,
		receivedQty,
		uomId: 1,
	}
}

function setup(overrides: { current?: TransferDetailDto; locationId?: number | null } = {}) {
	const state = {
		current: overrides.current ?? detail('requested'),
		locationId: overrides.locationId === undefined ? 1 : overrides.locationId,
		canShip: true,
		canReceive: true,
		fetchFailures: 0,
		ships: [] as unknown[],
		receives: [] as unknown[],
		refreshes: 0,
		fetches: 0,
	}
	const deps: TransferWorkflowDeps = {
		canShip: () => state.canShip,
		canReceive: () => state.canReceive,
		getActiveLocationId: () => state.locationId,
		fetchDetail: async () => {
			state.fetches++
			if (state.fetchFailures > 0) {
				state.fetchFailures--
				throw new Error('Network down')
			}
			return { data: state.current }
		},
		ship: async (input) => {
			state.ships.push(input)
		},
		receive: async (input) => {
			state.receives.push(input)
		},
		refreshReaders: async () => {
			state.refreshes++
		},
	}
	return { state, deps, workflows: createTransferWorkflows(deps) }
}

describe('remaining receipt quantities', () => {
	it('subtracts exactly across different decimal scales', () => {
		expect(remainingTransferQty('2.500125', '1.250000')).toBe('1.250125')
		expect(remainingTransferQty('10', '0.000001')).toBe('9.999999')
		expect(remainingTransferQty('1.5', '1.500')).toBe('0')
		expect(remainingTransferQty('0.3', '0.1')).toBe('0.2')
		expect(remainingTransferQty('9007199254740993.5', '0.5')).toBe('9007199254740993')
	})

	it('treats a missing receipt as zero and never goes negative', () => {
		expect(remainingTransferQty('2.500', null)).toBe('2.5')
		expect(remainingTransferQty('1', '1.5')).toBe('0')
	})

	it('sends only positive remaining lines', () => {
		expect(
			calculateRemainingReceiptLines([
				line(225, '2.500125', '1.250000'),
				line(1, '1.000', '1.000'),
				line(3, '4', null),
			]),
		).toEqual([
			{ materialId: 225, receivedQty: '1.250125' },
			{ materialId: 3, receivedQty: '4' },
		])
	})

	it('rejects malformed quantities instead of guessing', () => {
		expect(() => remainingTransferQty('abc', null)).toThrow('tidak valid')
	})
})

describe('ship workflow', () => {
	it('ships a requested transfer only from the source location', async () => {
		const { state, workflows } = setup()
		await workflows.ship.execute(detail('requested'))
		expect(state.ships).toEqual([{ transferId: 7 }])
	})

	it('is unavailable at the destination, without permission, or in the wrong status', () => {
		const { state, workflows } = setup()
		state.locationId = 2
		expect(workflows.ship.availability(detail('requested'))).not.toBe(true)
		state.locationId = 1
		state.canShip = false
		expect(workflows.ship.availability(detail('requested'))).not.toBe(true)
		state.canShip = true
		expect(workflows.ship.availability(detail('in_transit'))).not.toBe(true)
		expect(workflows.ship.availability(detail('requested'))).toBe(true)
	})

	it('refuses to write when the header changed during the fresh read', async () => {
		const { state, deps, workflows } = setup()
		deps.fetchDetail = async () => {
			state.locationId = 2
			return { data: state.current }
		}
		await expect(workflows.ship.execute(detail('requested'))).rejects.toThrow('lokasi asal')
		expect(state.ships).toEqual([])
	})

	it('rechecks permission even when the fresh read finds shipping already completed', async () => {
		const { state, deps, workflows } = setup({ current: detail('in_transit') })
		deps.fetchDetail = async () => {
			state.canShip = false
			return { data: state.current }
		}
		await expect(workflows.ship.execute(detail('requested'))).rejects.toThrow('izin')
		expect(state.ships).toEqual([])
		expect(state.refreshes).toBe(0)
	})

	it.each(['in_transit', 'received'] as const)(
		'does not write again when already %s',
		async (status) => {
			const { state, workflows } = setup({ current: detail(status) })
			await workflows.ship.execute(detail('requested'))
			expect(state.ships).toEqual([])
			expect(state.refreshes).toBe(1)
		},
	)

	it('rejects cancelled transfers', async () => {
		const { state, workflows } = setup({ current: detail('cancelled') })
		await expect(workflows.ship.execute(detail('requested'))).rejects.toThrow('status saat ini')
		expect(state.ships).toEqual([])
	})
})

describe('receive workflow', () => {
	const partial = detail('in_transit', [
		line(225, '2.500125', '1.250000'),
		line(1, '1.000', '1.000'),
	])

	it('sends only the outstanding delta after a partial receipt', async () => {
		const { state, workflows } = setup({ current: partial, locationId: 2 })
		await workflows.receive.execute(detail('in_transit'))
		expect(state.receives).toEqual([
			{ transferId: 7, lines: [{ materialId: 225, receivedQty: '1.250125' }] },
		])
	})

	it('is available only at the destination with permission while in transit', () => {
		const { state, workflows } = setup({ locationId: 2 })
		expect(workflows.receive.availability(detail('in_transit'))).toBe(true)
		state.locationId = 1
		expect(workflows.receive.availability(detail('in_transit'))).not.toBe(true)
		state.locationId = 2
		state.canReceive = false
		expect(workflows.receive.availability(detail('in_transit'))).not.toBe(true)
		state.canReceive = true
		expect(workflows.receive.availability(detail('requested'))).not.toBe(true)
	})

	it('never writes from the source location', async () => {
		const { state, workflows } = setup({ current: partial, locationId: 1 })
		await expect(workflows.receive.execute(detail('in_transit'))).rejects.toThrow('lokasi tujuan')
		expect(state.receives).toEqual([])
	})

	it('does not write when nothing remains or it is already received', async () => {
		const done = setup({
			current: detail('in_transit', [line(1, '1.000', '1.000')]),
			locationId: 2,
		})
		await done.workflows.receive.execute(detail('in_transit'))
		const received = setup({ current: detail('received'), locationId: 2 })
		await received.workflows.receive.execute(detail('in_transit'))
		expect(done.state.receives).toEqual([])
		expect(received.state.receives).toEqual([])
	})

	it('rejects a transfer that was never shipped', async () => {
		const { state, workflows } = setup({ current: detail('requested'), locationId: 2 })
		await expect(workflows.receive.execute(detail('in_transit'))).rejects.toThrow(
			'tidak sedang dalam perjalanan',
		)
		expect(state.receives).toEqual([])
	})
})

describe('dialog behavior', () => {
	function dialog(options: TransferWorkflows['receive']) {
		let onConfirm!: () => Promise<void>
		const successes: string[] = []
		const pending = Promise.withResolvers<boolean>()
		const action = createWorkflowAction(() => options, {
			confirm: (opts) => {
				onConfirm = opts.onConfirm
				return pending.promise
			},
			success: (message) => successes.push(message),
		})
		return { action, confirm: () => onConfirm(), successes }
	}

	it('keeps a failed detail read retryable with no mutation, then writes once', async () => {
		const { state, workflows } = setup({
			current: detail('in_transit', [line(5, '3', '1')]),
			locationId: 2,
		})
		state.fetchFailures = 1
		const flow = dialog(workflows.receive)
		void flow.action.run(detail('in_transit'))
		await expect(flow.confirm()).rejects.toThrow('Network down')
		expect(state.receives).toEqual([])
		expect(flow.successes).toEqual([])
		await flow.confirm()
		expect(state.fetches).toBe(2)
		expect(state.receives).toEqual([
			{ transferId: 7, lines: [{ materialId: 5, receivedQty: '2' }] },
		])
		await flow.confirm()
		expect(state.receives).toHaveLength(1)
		expect(flow.successes).toEqual(['Transfer berhasil diterima.'])
	})

	it('suppresses a duplicate run while pending and duplicate concurrent confirmations', async () => {
		const { state, workflows } = setup({
			current: detail('in_transit', [line(5, '3', null)]),
			locationId: 2,
		})
		const flow = dialog(workflows.receive)
		void flow.action.run(detail('in_transit'))
		expect(await flow.action.run(detail('in_transit'))).toBe(false)
		await Promise.all([flow.confirm(), flow.confirm()])
		expect(state.receives).toHaveLength(1)
	})
})

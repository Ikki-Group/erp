import { createCache } from '@/infra/cache/index.ts'

import type { StockBalanceDto } from '@/modules/inventory/stock/stock.contract.ts'
import type { IStockRepo } from '@/modules/inventory/stock/stock.repo.ts'
import { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { afterEach, describe, expect, setSystemTime, test } from 'bun:test'

function balance(quantity: string): StockBalanceDto {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only `quantity` matters to this test.
	return { materialId: 1, locationId: 1, quantity, costPrice: '1' } as StockBalanceDto
}

describe('stock balance cache', () => {
	afterEach(() => setSystemTime())

	test('a read that races a movement commit does not leave a stale cached balance', async () => {
		let current = balance('5')
		let releaseSlowRead: (() => void) | undefined
		let slowReadStarted: (() => void) | undefined
		const started = new Promise<void>((resolve) => (slowReadStarted = resolve))

		const repo = {
			async findBalance() {
				const snapshot = current
				if (!releaseSlowRead) {
					// First read: snapshot the pre-commit row, then stall until after invalidation.
					await new Promise<void>((resolve) => {
						releaseSlowRead = resolve
						slowReadStarted?.()
					})
				}
				return snapshot
			},
		}
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the balance read path only uses findBalance.
		const service = new StockService(
			repo as unknown as IStockRepo,
			createCache(),
			{} as AssignmentService,
		)
		const query = { materialId: 1, locationId: 1 }

		const t0 = Date.now()
		setSystemTime(t0)
		const racingRead = service.handleGetBalance(query)
		await started
		current = balance('8') // movement commits…
		await service.invalidateCache() // …and invalidates after commit
		setSystemTime(t0 + 5) // the stalled DB read returns a few ms after the invalidation
		releaseSlowRead?.()
		expect((await racingRead).quantity).toBe('5') // the racing reader itself saw old data

		expect((await service.handleGetBalance(query)).quantity).toBe('8')
	})
})

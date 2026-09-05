import { createMemoryEventBus } from '@/infra/events/event-bus.memory.ts'

import { describe, expect, test } from 'bun:test'

describe('memory event bus', () => {
	test('isolates handler failures and runs all handlers', async () => {
		const bus = createMemoryEventBus()
		const type = `T004Event_${crypto.randomUUID()}`
		let successfulHandlerCalls = 0

		bus.subscribe(type, () => {
			throw new Error('handler failure')
		})
		bus.subscribe(type, () => {
			successfulHandlerCalls += 1
		})

		expect(() => bus.publish({ type })).not.toThrow()
		await Promise.resolve()

		expect(successfulHandlerCalls).toBe(1)
	})
})

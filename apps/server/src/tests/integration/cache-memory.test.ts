import { cache } from '@/infra/cache/cache.memory.ts'

import { describe, expect, test } from 'bun:test'

describe('memory cache adapter', () => {
	test('refetches after invalidating an entity key', async () => {
		const namespace = `__t003_${crypto.randomUUID()}`
		const key = 'byId:1'
		let factoryCalls = 0

		await cache.getOrSet(namespace, key, async () => {
			factoryCalls += 1
			return { id: 1 }
		})
		await cache.invalidate(namespace, 1)
		const value = await cache.getOrSet(namespace, key, async () => {
			factoryCalls += 1
			return { id: 1 }
		})

		expect(value).toEqual({ id: 1 })
		expect(factoryCalls).toBe(2)
	})

	test('does not cache undefined values', async () => {
		const namespace = `__t003_${crypto.randomUUID()}`
		let factoryCalls = 0

		await cache.getOrSetOptional(namespace, 'byId:2', async () => {
			factoryCalls += 1
			return undefined
		})
		await cache.getOrSetOptional(namespace, 'byId:2', async () => {
			factoryCalls += 1
			return undefined
		})

		expect(factoryCalls).toBe(2)
	})
})

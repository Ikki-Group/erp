import { cachePort as cache } from '@/infra/cache/index.ts'

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

	test('invalidates entries by tag, including tags set from the factory', async () => {
		const namespace = `__t003_${crypto.randomUUID()}`
		let calls = 0
		const load = () =>
			cache.getOrSet(namespace, 'a', async (ctx) => {
				calls += 1
				ctx.setTags([`${namespace}:dyn`])
				return calls
			})
		const loadStatic = () =>
			cache.getOrSet(namespace, 'b', async () => ++calls, undefined, [`${namespace}:static`])

		await load()
		await load()
		expect(calls).toBe(1)
		await cache.invalidateTag(`${namespace}:dyn`)
		await load()
		expect(calls).toBe(2)

		await loadStatic()
		await cache.invalidateTag(`${namespace}:dyn`)
		await loadStatic()
		expect(calls).toBe(3)
		await cache.invalidateTag(`${namespace}:static`)
		await loadStatic()
		expect(calls).toBe(4)
	})
})

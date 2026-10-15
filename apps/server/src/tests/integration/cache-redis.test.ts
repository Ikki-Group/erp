import Redis from 'ioredis'

import { createCache, createCachePort } from '@/infra/cache/index.ts'
import { RedisSessionStore } from '@/infra/session/session.redis.ts'

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

const REDIS_URL = process.env.REDIS_URL

describe.skipIf(!REDIS_URL)('redis-backed cache and sessions', () => {
	let redisA: Redis
	let redisB: Redis
	let machineA: ReturnType<typeof createCache>
	let machineB: ReturnType<typeof createCache>

	beforeAll(() => {
		redisA = new Redis(REDIS_URL!)
		redisB = new Redis(REDIS_URL!)
		machineA = createCache({ redis: redisA })
		machineB = createCache({ redis: redisB })
	})

	afterAll(async () => {
		await machineA.disconnectAll()
		await machineB.disconnectAll()
		for (const r of [redisA, redisB]) if (r.status !== 'end') await r.quit()
	})

	const waitForBus = () => Bun.sleep(200)

	test('key invalidation on one instance evicts L1 on the other via bus', async () => {
		const portA = createCachePort(machineA)
		const portB = createCachePort(machineB)
		const ns = `__bus_${crypto.randomUUID()}`
		await waitForBus() // let bus subscriptions settle

		expect(await portA.getOrSet(ns, 'byId:1', async () => 'v1')).toBe('v1')
		// B reads through L2 into its own L1
		expect(await portB.getOrSet(ns, 'byId:1', async () => 'unexpected')).toBe('v1')

		await portA.invalidate(ns, 1)
		await waitForBus()
		expect(await portB.getOrSet(ns, 'byId:1', async () => 'v2')).toBe('v2')
	})

	test('tag invalidation on one instance evicts tagged entries on the other', async () => {
		const portA = createCachePort(machineA)
		const portB = createCachePort(machineB)
		const ns = `__bus_${crypto.randomUUID()}`
		const tag = `${ns}:role`

		await portB.getOrSet(ns, 'access', async (ctx) => {
			ctx.setTags([tag])
			return 'old'
		})
		expect(await portB.getOrSet(ns, 'access', async () => 'unexpected')).toBe('old')

		await portA.invalidateTag(tag)
		await waitForBus()
		expect(await portB.getOrSet(ns, 'access', async () => 'new')).toBe('new')
	})

	test('session store round-trip against real Redis', async () => {
		const store = new RedisSessionStore({ client: redisA, ttlSeconds: 60 })
		const userId = Math.floor(Math.random() * 1e9)
		const expiresAt = new Date(Date.now() + 60_000)
		const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
		for (const id of ids) await store.create({ id, userId, expiresAt })

		const got = await store.get(ids[0]!)
		expect(got).toEqual({ id: ids[0]!, userId, expiresAt })
		expect(await redisA.ttl(`auth:session:${ids[0]}`)).toBeGreaterThan(0)
		expect(await redisA.ttl(`auth:session:user:${userId}`)).toBeGreaterThan(0)

		await store.delete(ids[0]!)
		expect(await store.get(ids[0]!)).toBeUndefined()
		expect((await redisA.smembers(`auth:session:user:${userId}`)).sort()).toEqual(
			ids.slice(1).sort(),
		)

		await store.deleteAllForUser(userId)
		expect(await store.get(ids[1]!)).toBeUndefined()
		expect(await store.get(ids[2]!)).toBeUndefined()
		expect(await redisA.exists(`auth:session:user:${userId}`)).toBe(0)
	})

	test('expired session payload is treated as missing', async () => {
		const store = new RedisSessionStore({ client: redisA, ttlSeconds: 60 })
		const id = crypto.randomUUID()
		await store.create({ id, userId: 1, expiresAt: new Date(Date.now() - 1000) })
		expect(await store.get(id)).toBeUndefined()
		expect(await redisA.exists(`auth:session:${id}`)).toBe(0)
	})
})

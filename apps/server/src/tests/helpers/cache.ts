import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

const testCache = new BentoCache({
	default: 'memory',
	stores: {
		memory: bentostore().useL1Layer(memoryDriver({ maxSize: '1mb' })),
	},
})

export async function clearTestCache(): Promise<void> {
	await testCache.disconnect()
}

export function createTestCache() {
	return testCache
}

import { BentoCache, BentoStore, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

export type CacheClient = BentoCache<{
	cache: BentoStore
}>

export type CacheProvider = ReturnType<CacheClient['namespace']>

export function createCache(): CacheClient {
	return new BentoCache({
		default: 'cache',
		ttl: '1d',
		// logger,
		stores: {
			cache: bentostore().useL1Layer(memoryDriver({ maxSize: '10mb' })),
		},
	})
}

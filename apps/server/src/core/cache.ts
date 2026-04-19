import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { createCache } from 'cache-manager'

export const bento = new BentoCache({
	default: 'cache',
	ttl: '1d',
	// logger,
	onFactoryError(error) {
		// console.log({ error })
		throw error
	},
	stores: {
		cache: bentostore().useL1Layer(memoryDriver({ maxSize: '10mb' })),
	},
})

// Handle serialization/deserialization of cache values
/** @deprecated */
export const cache = createCache({})

import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

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

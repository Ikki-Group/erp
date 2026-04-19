// oxlint-disable typescript/no-unsafe-assignment
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

// await bento.set({ key: 'user:42', value: { name: 'jul' } })
// console.log(await bento.get({ key: 'user:42' }))

// let counter = 0
// try {
// 	const res = await bento.getOrSet({
// 		key: 'example',
// 		factory: ({ fail, skip }) => {
// 			console.log('Hit', ++counter)

// 			return skip()
// 			return 'faa'
// 		},
// 	})

// 	console.log({
// 		res,
// 		next: await bento.get({ key: 'example' }),
// 		next2: await bento.get({ key: 'example' }),
// 		next3: await bento.get({ key: 'example' }),
// 	})

// 	await sleep(1000)
// 	console.log({
// 		next: await bento.get({ key: 'example' }),
// 		next2: await bento.get({ key: 'example' }),
// 		next3: await bento.get({ key: 'example' }),
// 	})
// } catch (error) {
// 	console.error({
// 		isErr: error instanceof NotFoundError,
// 	})
// }

// TODO
// Handle serialization/deserialization of cache values
export const cache = createCache({})

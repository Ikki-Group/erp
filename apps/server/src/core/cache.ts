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

export const CACHE_KEY_DEFAULT = {
	list: 'list',
	count: 'count',
	byId: (id: number | string) => `byId:${id}`,
}

// Cache Event System for cross-domain invalidation
export type CacheEventType =
	| 'material-location.stock-updated'
	| 'stock-transaction.created'
	| 'stock-summary.updated'

export interface CacheEvent {
	type: CacheEventType
	payload: Record<string, unknown>
}

export class CacheEventBus {
	private listeners = new Map<CacheEventType, Set<(e: CacheEvent) => void>>()

	on(type: CacheEventType, handler: (e: CacheEvent) => void): () => void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set())
		}
		this.listeners.get(type)!.add(handler)

		// Return unsubscribe function
		return () => {
			this.listeners.get(type)?.delete(handler)
		}
	}

	emit(type: CacheEventType, payload: Record<string, unknown>): void {
		const event: CacheEvent = { type, payload }
		const handlers = this.listeners.get(type)
		if (handlers) {
			handlers.forEach((handler) => {
				try {
					handler(event)
				} catch (error) {
					// Silently handle errors to prevent disrupting main flow
					console.error(`Cache event handler error for ${type}:`, error)
				}
			})
		}
	}
}

// Global cache event bus instance
export const cacheEventBus = new CacheEventBus()

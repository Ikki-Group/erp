import { record } from '@elysiajs/opentelemetry'

import { createCache, type CacheClient, type CacheProvider } from './cache'
import type { ConfigNamespace } from './config'
import type { DeleteManyOptions, GetOrSetOptions } from 'bentocache/types'

interface CacheServiceOptions {
	ns: ConfigNamespace
	client: CacheClient
}

export class CacheService {
	public readonly cache: CacheProvider

	constructor({ ns, client }: CacheServiceOptions) {
		this.cache = client.namespace(ns)
	}

	async getOrSet<T>(options: GetOrSetOptions<T>): Promise<T> {
		return record('CacheService.getOrSet', () => this.cache.getOrSet(options))
	}

	async getOrSetSkipUndefined<T>(options: GetOrSetOptions<T>): Promise<T | undefined> {
		return record('CacheService.getOrSetSkipUndefined', () => {
			return this.cache.getOrSet({
				...options,
				factory: async (ctx) => {
					const value = await options.factory(ctx)
					if (value === undefined) return ctx.skip()
					return value
				},
			})
		})
	}

	async deleteMany({
		keys,
		...options
	}: Omit<DeleteManyOptions, 'keys'> & { keys: (string | undefined | null)[] }): Promise<boolean> {
		return record('CacheService.deleteMany', async () => {
			const filteredKeys = keys.filter(Boolean)
			if (filteredKeys.length === 0) return false
			return this.cache.deleteMany({ keys: filteredKeys, ...options })
		})
	}
}

// Usage

const cache = new CacheService({
	ns: 'iam.user',
	client: createCache(),
})

await cache.deleteMany({
	keys: ['iam.user.list', 'iam.user.count', null],
})

import { record } from '@elysiajs/opentelemetry'

import type { CacheClient } from './cache'
import type { ConfigNamespace } from './config'
import type { CacheProvider, DeleteManyOptions, GetOrSetOptions } from 'bentocache/types'

interface CacheServiceOptions {
	ns: ConfigNamespace
	client: CacheClient
}

export class CacheService {
	public readonly cache: CacheProvider
	public readonly ns: ConfigNamespace

	constructor({ ns, client }: CacheServiceOptions) {
		this.ns = ns
		this.cache = client.namespace(ns)
	}

	async getOrSet<T>(options: GetOrSetOptions<T>): Promise<T> {
		return record('CacheService.getOrSet', (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.cache.getOrSet(options)
		})
	}

	async getOrSetSkipUndefined<T>(options: GetOrSetOptions<T>): Promise<T | undefined> {
		return record('CacheService.getOrSetSkipUndefined', (s) => {
			s.setAttribute('cache.namespace', this.ns)
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
		return record('CacheService.deleteMany', async (s) => {
			s.setAttribute('cache.namespace', this.ns)
			const filteredKeys = keys.filter(Boolean)
			if (filteredKeys.length === 0) return false
			return this.cache.deleteMany({ keys: filteredKeys, ...options })
		})
	}
}

// Usage
// const cache = new CacheService({ ns: 'iam.user', client: createCache() })

// const a = await cache.getOrSet3({
// 	key: 'test',
// 	policy: 'default',
// 	factory: async () => {
// 		return 'test'
// 	},
// })

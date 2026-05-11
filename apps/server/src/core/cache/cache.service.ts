import { record } from '@elysiajs/opentelemetry'

import { type CacheClient } from './cache'
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

type KeyFactory = string | ((...any: any[]) => string)
type CacheKeys = Record<string, KeyFactory>

const DEFAULT_KEYS = {
	list: 'list',
	count: 'count',
	byId: (id: number | string) => `byId:${id}`,
} satisfies CacheKeys

export class CacheServiceV2<T extends CacheKeys = typeof DEFAULT_KEYS> {
	constructor(
		public readonly client: CacheClient,
		public readonly ns: ConfigNamespace,
		public readonly keys: T,
	) {}

	static readonly DEFAULT_KEYS = DEFAULT_KEYS

	static createWithDefaultKeys(client: CacheClient, ns: ConfigNamespace): CacheServiceV2 {
		return new CacheServiceV2(client, ns, DEFAULT_KEYS)
	}

	#buildKey(key: KeyFactory): string {
		return typeof key === 'function' ? key() : key
	}

	async getOrSet<T>(key: KeyFactory, options: Omit<GetOrSetOptions<T>, 'key'>): Promise<T> {
		return record('CacheService.getOrSet', (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.client.getOrSet({
				key: this.#buildKey(key),
				...options,
			})
		})
	}

	async getOrSetSkipUndefined<T>(
		key: KeyFactory,
		options: Omit<GetOrSetOptions<T>, 'key'>,
	): Promise<T | undefined> {
		return record('CacheService.getOrSetSkipUndefined', (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.client.getOrSet({
				key: this.#buildKey(key),
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
	}: Omit<DeleteManyOptions, 'keys'> & {
		keys: (KeyFactory | undefined | null)[]
	}): Promise<boolean> {
		return record('CacheService.deleteMany', async (s) => {
			s.setAttribute('cache.namespace', this.ns)
			const filteredKeys = keys.reduce<string[]>((acc, key) => {
				if (key === undefined || key === null) return acc
				acc.push(this.#buildKey(key))
				return acc
			}, [])
			if (filteredKeys.length === 0) return false
			return this.client.deleteMany({ keys: filteredKeys, ...options })
		})
	}
}

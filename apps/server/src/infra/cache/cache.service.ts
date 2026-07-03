import { record } from '@elysiajs/opentelemetry'

import { type CacheClient } from './cache'
import type { ConfigNamespace } from './config'
import type { CacheProvider, DeleteManyOptions, GetOrSetOptions } from 'bentocache/types'

type KeyFactory = string | ((...any: any[]) => string)
type CacheKeys = Record<string, KeyFactory>

type GetOrSetOptionsWithKey<T> = Omit<GetOrSetOptions<T>, 'key'> & { key: KeyFactory }

const DEFAULT_KEYS = {
	list: 'list',
	count: 'count',
	byId: (id: number | string) => `byId:${id}`,
} satisfies CacheKeys

export class CacheService<T extends CacheKeys = typeof DEFAULT_KEYS> {
	public readonly cache: CacheProvider

	constructor(
		readonly client: CacheClient,
		public readonly ns: ConfigNamespace,
		public readonly keys: T,
	) {
		this.cache = client.namespace(ns)
	}

	static readonly DEFAULT_KEYS = DEFAULT_KEYS

	static createWithDefaultKeys(client: CacheClient, ns: ConfigNamespace): CacheService {
		return new CacheService(client, ns, DEFAULT_KEYS)
	}

	#buildKey(key: KeyFactory): string {
		return typeof key === 'function' ? key() : key
	}

	async getOrSet<T>({ key, ...options }: GetOrSetOptionsWithKey<T>): Promise<T> {
		return record('CacheService.getOrSet', (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.cache.getOrSet({
				key: this.#buildKey(key),
				...options,
			})
		})
	}

	async getOrSetWithSkip<T>({
		key,
		...options
	}: GetOrSetOptionsWithKey<T>): Promise<T | undefined> {
		return record('CacheService.getOrSetWithSkip', (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.cache.getOrSet({
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
			return this.cache.deleteMany({ keys: filteredKeys, ...options })
		})
	}

	async deleteFromKeys(keys: (KeyFactory | undefined | null)[]): Promise<boolean> {
		return record('CacheService.deleteFromKeys', async (s) => {
			s.setAttribute('cache.namespace', this.ns)
			return this.deleteMany({ keys: keys })
		})
	}

	/**
	 * Invalidate every cache entry (in this namespace or any other) tagged with
	 * any of the given tags — including composed/"runtime join" reads cached by
	 * OTHER modules that referenced this entity.
	 *
	 * Prefer this over enumerating derived keys by hand: a composed read (e.g.
	 * "sales order with items + customer + location") only needs to tag itself
	 * with the ids it touched; every module that mutates those ids can then
	 * invalidate by tag without knowing which composed views exist.
	 *
	 * Tags are backend-agnostic (bentocache tracks invalidation timestamps
	 * client-side), so this works even in L1-memory-only mode.
	 */
	async deleteByTags(tags: (string | undefined | null)[]): Promise<boolean> {
		return record('CacheService.deleteByTags', async (s) => {
			s.setAttribute('cache.namespace', this.ns)
			const filteredTags = tags.filter((tag): tag is string => tag !== undefined && tag !== null)
			if (filteredTags.length === 0) return false
			return this.cache.deleteByTag({ tags: filteredTags })
		})
	}
}

/**
 * Stable tag builder — `entityTag('location', 5)` → `'location:5'`.
 *
 * Use these as `tags` on `getOrSet()` calls for any cached read that embeds
 * data from a foreign entity (RelationMap joins, composed DTOs, dashboards).
 * The owning module's service can then call `deleteByTags([entityTag('location', id)])`
 * on mutation to invalidate every dependent cache entry across ALL modules,
 * without either module knowing about the other's cache keys.
 */
export function entityTag(entity: string, id: number | string): string {
	return `${entity}:${id}`
}

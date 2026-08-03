import { withSpan } from '@/infra/otel'

import { type CacheClient } from './cache'
import type { ConfigNamespace } from './config'
import type { CacheProvider, DeleteManyOptions, GetOrSetOptions } from 'bentocache/types'

type KeyFactory = string | ((...args: (string | number)[]) => string)
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
		return withSpan('CacheService.getOrSet', { 'cache.namespace': this.ns }, () =>
			this.cache.getOrSet({ key: this.#buildKey(key), ...options }),
		)
	}

	/** Same as getOrSet but skips caching when factory returns `undefined`. */
	async getOrSetWithSkip<T>({
		key,
		...options
	}: GetOrSetOptionsWithKey<T>): Promise<T | undefined> {
		return withSpan('CacheService.getOrSetWithSkip', { 'cache.namespace': this.ns }, () =>
			this.cache.getOrSet({
				key: this.#buildKey(key),
				...options,
				factory: async (ctx) => {
					const value = await options.factory(ctx)
					if (value === undefined) return ctx.skip()
					return value
				},
			}),
		)
	}

	async deleteMany({
		keys,
		...options
	}: Omit<DeleteManyOptions, 'keys'> & {
		keys: (KeyFactory | undefined | null)[]
	}): Promise<boolean> {
		return withSpan('CacheService.deleteMany', { 'cache.namespace': this.ns }, () => {
			const filteredKeys = keys.reduce<string[]>((acc, key) => {
				if (key === undefined || key === null) return acc
				acc.push(this.#buildKey(key))
				return acc
			}, [])
			if (filteredKeys.length === 0) return Promise.resolve(false)
			return this.cache.deleteMany({ keys: filteredKeys, ...options })
		})
	}

	/** Alias for `deleteMany({ keys })` — the common invalidation case. */
	async deleteFromKeys(keys: (KeyFactory | undefined | null)[]): Promise<boolean> {
		return this.#safeInvalidate(() => this.deleteMany({ keys }))
	}

	/**
	 * Standard cache invalidation: clears `list`, `count`, and optionally `byId(id)`.
	 * Covers the common 90% pattern across all CRUD services.
	 *
	 * @example
	 * await this.cache.invalidateStandard()       // after create (no specific id)
	 * await this.cache.invalidateStandard(id)     // after update/delete
	 */
	async invalidateStandard(id?: number | string): Promise<void> {
		const keys: (KeyFactory | undefined | null)[] = [
			DEFAULT_KEYS.list,
			DEFAULT_KEYS.count,
			id !== undefined ? DEFAULT_KEYS.byId(id) : null,
		]
		await this.deleteFromKeys(keys)
	}

	/** Invalidate cache entries by tag across all namespaces. */
	async deleteByTags(tags: (string | undefined | null)[]): Promise<boolean> {
		return this.#safeInvalidate(() =>
			withSpan('CacheService.deleteByTags', { 'cache.namespace': this.ns }, () => {
				const filteredTags = tags.filter((tag): tag is string => tag !== undefined && tag !== null)
				if (filteredTags.length === 0) return Promise.resolve(false)
				return this.cache.deleteByTag({ tags: filteredTags })
			}),
		)
	}

	/**
	 * Wrap invalidation so cache failures don't crash mutations.
	 * A failed invalidation = temporary staleness (self-heals via TTL), not a fatal error.
	 */
	async #safeInvalidate(fn: () => Promise<boolean>): Promise<boolean> {
		try {
			return await fn()
		} catch (err) {
			const { logger } = await import('@/infra/logger')
			logger.warn('Cache invalidation failed (non-fatal)', {
				namespace: this.ns,
				error: err instanceof Error ? err.message : String(err),
			})
			return false
		}
	}
}

/** Stable tag: `entityTag('location', 5)` → `'location:5'`. */
export function entityTag(entity: string, id: number | string): string {
	return `${entity}:${id}`
}

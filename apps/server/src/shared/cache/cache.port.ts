interface CacheFactoryContext {
	/** Attach invalidation tags to the value being computed (e.g. derived from the value). */
	setTags(tags: string[]): void
}

export interface CachePort {
	/** Read-through: return cached value or compute, store, and return it. */
	getOrSet<T>(
		namespace: string,
		key: string,
		factory: (ctx: CacheFactoryContext) => Promise<T>,
		ttlSeconds?: number,
		tags?: string[],
	): Promise<T>
	/** Read-through that does not cache undefined values. */
	getOrSetOptional<T>(
		namespace: string,
		key: string,
		factory: () => Promise<T | undefined>,
	): Promise<T | undefined>
	/** Invalidate list/count keys and one entity key when an id is provided. */
	invalidate(namespace: string, id?: number): Promise<void>
	/** Invalidate an explicit set of fully-qualified keys. */
	invalidateKeys(keys: string[]): Promise<void>
	/** Invalidate all entries tagged with a cache tag. */
	invalidateTag(tag: string): Promise<void>
}

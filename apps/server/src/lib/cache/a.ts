import type { CacheClient } from './cache'
import type { ConfigNamespace } from './config'

type ExpandKey<K> = K extends `${infer P}.${number}` ? `${P}.${number}` : K

type ResolveKey<T> = {
	[K in keyof T]: ExpandKey<K>
}[keyof T]

type ValueOfKey<T, K> = K extends keyof T
	? T[K]
	: K extends `${infer P}.${number}`
		? `${P}.${number}` extends keyof T
			? T[`${P}.${number}`]
			: never
		: never

export class CacheService<TSchema extends Record<string, any>> {
	constructor(
		private readonly ns: ConfigNamespace,
		private readonly cache: CacheClient,
	) {}

	private buildKey(key: string) {
		return `${this.ns}.${key}`
	}

	async get<K extends ResolveKey<TSchema>>(key: K): Promise<ValueOfKey<TSchema, K> | undefined> {
		return this.cache.getOrSet({
			key: this.buildKey(key as string),
			factory: async () => undefined,
		})
	}

	async set<K extends ResolveKey<TSchema>>(key: K, value: ValueOfKey<TSchema, K>) {
		return this.cache.set(this.buildKey(key as string), value)
	}
}

type UserCache = {
	test: string
	'id.${number}': { id: number; name: string }
}

const cache = new CacheService<UserCache>('iam.user', new CacheClient())

// ✅ correct inference
const a = await cache.get('test')
// string | undefined

const b = await cache.get('id.2')
// { id: number; name: string } | undefined

// ❌ compile error
void cache.get('id.abc')

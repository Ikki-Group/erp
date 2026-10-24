// ─── RelationMap (avoid N+1) ───

export class RelationMap<K, V> {
	private readonly map: Map<K, V>

	private constructor(map: Map<K, V>) {
		this.map = map
	}

	static fromArray<V, K>(items: V[], keyFn: (item: V) => K): RelationMap<K, V> {
		const map = new Map<K, V>()
		for (const item of items) {
			map.set(keyFn(item), item)
		}
		return new RelationMap(map)
	}

	get(key: K): V | undefined {
		return this.map.get(key)
	}

	has(key: K): boolean {
		return this.map.has(key)
	}

	values(): V[] {
		return [...this.map.values()]
	}
}

// ─── Assertion ───

export function assertFound<T>(value: T | undefined, errorFactory: () => Error): T {
	if (value === undefined) throw errorFactory()
	return value
}

// ─── Password Hashing ───

export async function hashPassword(password: string): Promise<string> {
	return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 12 })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return Bun.password.verify(password, hash)
}

// oxlint-disable typescript/no-unsafe-type-assertion

export class RelationMap<K, V> extends Map<K, V> {
	/**
	 * Create map from array (last item wins on duplicate key)
	 */
	static fromArray<K, V>(arr: V[], keySelector: (item: V) => K): RelationMap<K, V> {
		const map = new RelationMap<K, V>()
		for (const item of arr) {
			map.set(keySelector(item), item)
		}
		return map
	}

	/**
	 * Group array into map of arrays (1:N)
	 */
	static groupFromArray<K, V>(arr: V[], keySelector: (item: V) => K): RelationMap<K, V[]> {
		const map = new RelationMap<K, V[]>()
		for (const item of arr) {
			const key = keySelector(item)
			let group = map.get(key)
			if (!group) {
				group = []
				map.set(key, group)
			}
			group.push(item)
		}
		return map
	}

	/**
	 * Strict get (throws if missing)
	 */
	getRequired(key: K, errorMessage?: string | ((key: K) => string)): V {
		if (!this.has(key)) {
			const message = typeof errorMessage === 'function' ? errorMessage(key) : errorMessage
			throw new Error(message ?? `Key ${String(key)} not found`)
		}
		return this.get(key) as V
	}

	/**
	 * Get many (skip missing)
	 */
	getMany(keys: K[]): V[] {
		const result: V[] = []
		for (const key of keys) {
			if (this.has(key)) {
				result.push(this.get(key) as V)
			}
		}
		return result
	}

	/**
	 * Strict get many
	 */
	getManyRequired(keys: K[], errorMessage?: (key: K) => string): V[] {
		const result: V[] = []
		for (const key of keys) {
			if (!this.has(key)) {
				throw new Error(errorMessage?.(key) ?? `Key ${String(key)} not found`)
			}
			result.push(this.get(key) as V)
		}
		return result
	}

	/**
	 * Map entries to array
	 */
	mapToArray<R>(fn: (value: V, key: K) => R): R[] {
		const result: R[] = []
		for (const [key, value] of this.entries()) {
			result.push(fn(value, key))
		}
		return result
	}

	/**
	 * Left join (1:1 optional)
	 */
	leftJoin<F, J, R>(
		mapper: Map<F, J>,
		foreignKeySelector: (item: V) => F,
		resultSelector: (item: V, joined: J | undefined) => R,
	): R[] {
		return this.mapToArray((item) => {
			const fk = foreignKeySelector(item)
			return resultSelector(item, mapper.get(fk))
		})
	}

	/**
	 * Inner join required (1:1 strict)
	 */
	innerJoinRequired<F, J, R>(
		mapper: Map<F, J>,
		foreignKeySelector: (item: V) => F,
		resultSelector: (item: V, joined: J) => R,
		errorMessage?: string | ((item: V, fk: F) => string),
	): R[] {
		return this.mapToArray((item) => {
			const fk = foreignKeySelector(item)

			if (!mapper.has(fk)) {
				const message = typeof errorMessage === 'function' ? errorMessage(item, fk) : errorMessage
				throw new Error(message ?? `Missing relation for key ${String(fk)}`)
			}

			return resultSelector(item, mapper.get(fk) as J)
		})
	}

	/**
	 * Inner join many (1:N strict)
	 */
	innerJoinMany<F, J, R>(
		mapper: Map<F, J[]>,
		foreignKeySelector: (item: V) => F,
		resultSelector: (item: V, joined: J[]) => R,
		errorMessage?: string | ((item: V, fk: F) => string),
	): R[] {
		return this.mapToArray((item) => {
			const fk = foreignKeySelector(item)

			if (!mapper.has(fk)) {
				const message = typeof errorMessage === 'function' ? errorMessage(item, fk) : errorMessage
				throw new Error(message ?? `Missing relation for key ${String(fk)}`)
			}

			return resultSelector(item, mapper.get(fk) as J[])
		})
	}
}

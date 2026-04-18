/**
 * Groups an array of items into a Map based on a key selector.
 * Useful for 1:N relationships.
 */
export function arrayToMap<TKey, TItem>(
	arr: TItem[],
	keySelector: (item: TItem) => TKey,
): Map<TKey, TItem[]> {
	const map = new Map<TKey, TItem[]>()
	for (const item of arr) {
		const key = keySelector(item)
		const group = map.get(key)
		if (group) {
			group.push(item)
		} else {
			map.set(key, [item])
		}
	}
	return map
}

/**
 * Indexes an array of items into a Map based on a unique key selector.
 * Useful for 1:1 relationships.
 */
export function arrayToUniqueMap<TKey, TItem>(
	arr: TItem[],
	keySelector: (item: TItem) => TKey,
): Map<TKey, TItem> {
	return new Map(arr.map((item) => [keySelector(item), item]))
}

/**
 * Splits an array into chunks of a specific size.
 * Useful for batch database operations to avoid parameter limits.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size))
	}
	return chunks
}

/**
 * Returns a new array with unique elements from the original array.
 */
export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)]
}

/**
 * Returns a new array with unique elements based on a key selector.
 */
export function uniqueBy<T, K>(arr: T[], keySelector: (item: T) => K): T[] {
	const seen = new Set<K>()
	return arr.filter((item) => {
		const key = keySelector(item)
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

/**
 * Calculates the sum of a numeric property in an array of items.
 */
export function sumBy<T>(arr: T[], selector: (item: T) => number): number {
	return arr.reduce((acc, item) => acc + selector(item), 0)
}

/**
 * Partitions an array into two arrays based on a predicate.
 * The first array contains items that match the predicate, the second contains those that don't.
 */
export function partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
	const match: T[] = []
	const noMatch: T[] = []
	for (const item of arr) {
		if (predicate(item)) {
			match.push(item)
		} else {
			noMatch.push(item)
		}
	}
	return [match, noMatch]
}

/**
 * Collection mapper functionality to simplify array mapping and complex joins
 *
 * Features:
 * - Runtime data joining (leftJoin, innerJoinRequired)
 * - Enriched Map methods (getRequired, getMany, mapToArray)
 * - Error handling for missing data during join or lookups
 * - Factories for From array to collection mapping (fromArray, groupFromArray)
 */
export class CollectionMapper<K, V> extends Map<K, V> {
	// oxlint-disable-next-line no-useless-constructor
	// constructor(entries?: readonly (readonly [K, V])[] | null) {
	// 	super(entries)
	// }

	/**
	 * Creates a CollectionMapper from an array by resolving a key for each item.
	 * If multiple items have the same key, the last one wins.
	 */
	static fromArray<K, V>(arr: V[], keySelector: (item: V) => K): CollectionMapper<K, V> {
		const map = new CollectionMapper<K, V>()
		for (const item of arr) {
			map.set(keySelector(item), item)
		}
		return map
	}

	/**
	 * Creates a CollectionMapper where each key maps to an array of items (grouping).
	 */
	static groupFromArray<K, V>(arr: V[], keySelector: (item: V) => K): CollectionMapper<K, V[]> {
		const map = new CollectionMapper<K, V[]>()
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
	 * Retrieves an item by key, throwing an error if the item does not exist.
	 * Essential for strictly handling required lookup data.
	 */
	getRequired(key: K, errorMessage?: string | ((key: K) => string)): V {
		const item = this.get(key)
		if (item === undefined && !this.has(key)) {
			const message = typeof errorMessage === 'function' ? errorMessage(key) : errorMessage
			throw new Error(message ?? `Item with key ${String(key)} not found in collection`)
		}
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		return item as V
	}

	/**
	 * Retrieves an array of items corresponding to the provided keys.
	 * Skips keys that do not exist in the collection.
	 */
	getMany(keys: K[]): V[] {
		const result: V[] = []
		for (const key of keys) {
			const item = this.get(key)
			if (item !== undefined || this.has(key)) {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				result.push(item as V)
			}
		}
		return result
	}

	/**
	 * Maps over the collection entries and returns an array of the results.
	 */
	mapToArray<R>(fn: (value: V, key: K) => R): R[] {
		const result: R[] = []
		for (const [key, value] of this.entries()) {
			result.push(fn(value, key))
		}
		return result
	}

	/**
	 * Performs a runtime left join between this collection's values and another map/collection.
	 * Useful for attaching optional relationships.
	 */
	leftJoin<F, J, R>(
		mapper: Map<F, J>,
		foreignKeySelector: (item: V) => F,
		resultSelector: (item: V, joinedItem: J | undefined) => R,
	): R[] {
		return this.mapToArray((item) => {
			const fk = foreignKeySelector(item)
			const joinedItem = mapper.get(fk)
			return resultSelector(item, joinedItem)
		})
	}

	/**
	 * Performs a runtime inner join, throwing an error if the joined item is missing.
	 * Useful for ensuring strong data integrity when assembling relationships.
	 */
	innerJoinRequired<F, J, R>(
		mapper: Map<F, J>,
		foreignKeySelector: (item: V) => F,
		resultSelector: (item: V, joinedItem: J) => R,
		errorMessage?: string | ((item: V, fk: F) => string),
	): R[] {
		return this.mapToArray((item) => {
			const fk = foreignKeySelector(item)
			const joinedItem = mapper.get(fk)

			if (joinedItem === undefined && !mapper.has(fk)) {
				const message = typeof errorMessage === 'function' ? errorMessage(item, fk) : errorMessage
				throw new Error(message ?? `Required join data for foreign key ${String(fk)} not found`)
			}

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			return resultSelector(item, joinedItem as J)
		})
	}
}

type Customer = {
	id: string
	name: string
}

type Order = {
	id: string
	customerId: string
}

type OrderItem = {
	id: string
	orderId: string
	product: string
	qty: number
}

const customers: Customer[] = [
	{ id: 'c1', name: 'Alice' },
	{ id: 'c2', name: 'Bob' },
]

const orders: Order[] = [
	{ id: 'o1', customerId: 'c1' },
	{ id: 'o2', customerId: 'c2' },
]

const orderItems: OrderItem[] = [
	{ id: 'i1', orderId: 'o1', product: 'Laptop', qty: 1 },
	{ id: 'i2', orderId: 'o1', product: 'Mouse', qty: 2 },
	{ id: 'i3', orderId: 'o2', product: 'Keyboard', qty: 1 },
]

const customerMap = CollectionMapper.fromArray(customers, (c) => c.id)
const orderMap = CollectionMapper.fromArray(orders, (o) => o.id)

// group → one-to-many
const orderItemsMap = CollectionMapper.groupFromArray(orderItems, (i) => i.orderId)

const ordersWithCustomer = orderMap.innerJoinRequired(
	customerMap,
	(order) => order.customerId,
	(order, customer) => ({
		...order,
		customer,
	}),
)

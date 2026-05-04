/**
 * Collection utility functions for array operations
 * @module lib/utils/collection
 */

/**
 * Groups an array of items into a Map based on a key selector.
 * Useful for 1:N relationships.
 * @param arr - Array to group
 * @param keySelector - Function to extract key from each item
 * @returns Map where keys are from keySelector and values are arrays of items
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
 * @param arr - Array to index
 * @param keySelector - Function to extract unique key from each item
 * @returns Map where keys are from keySelector and values are single items
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
 * @param arr - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
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
 * @param arr - Array to deduplicate
 * @returns Array with unique elements
 */
export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)]
}

/**
 * Returns a new array with unique elements based on a key selector.
 * @param arr - Array to deduplicate
 * @param keySelector - Function to extract key for comparison
 * @returns Array with unique elements based on key
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
 * @param arr - Array of items
 * @param selector - Function to extract numeric value from each item
 * @returns Sum of all selected values
 */
export function sumBy<T>(arr: T[], selector: (item: T) => number): number {
	return arr.reduce((acc, item) => acc + selector(item), 0)
}

/**
 * Partitions an array into two arrays based on a predicate.
 * The first array contains items that match the predicate, the second contains those that don't.
 * @param arr - Array to partition
 * @param predicate - Predicate function to test each item
 * @returns Tuple of [matching items, non-matching items]
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

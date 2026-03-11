/**
 * Groups an array of items into a Map based on a key selector.
 * Useful for 1:N relationships.
 */
export function arrayToMap<TKey, TItem>(arr: TItem[], keySelector: (item: TItem) => TKey): Map<TKey, TItem[]> {
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
export function arrayToUniqueMap<TKey, TItem>(arr: TItem[], keySelector: (item: TItem) => TKey): Map<TKey, TItem> {
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

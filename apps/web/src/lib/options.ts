// oxlint-disable typescript/no-unsafe-call
// oxlint-disable typescript/no-unsafe-assignment

export type StringOrNumber = string | number

/**
 * Standardized option interface used for selection components like Combobox or Select.
 */
export interface Option<TValue extends StringOrNumber = string, TData = any> {
	/** The unique identifier for the option. */
	value: TValue
	/** The human-readable string displayed to the user. */
	label: string
	/**
	 * The original data reference. Useful for retrieving additional fields
	 * without performing secondary lookups after an option is selected.
	 */
	_data: TData
}

/**
 * Converts an array of primitive literals (strings or numbers) into an array of `Option` objects.
 *
 * @example
 * ```ts
 * const options = arrayToOptions(['PENDING', 'ACTIVE'])
 * // Output: [{ value: 'PENDING', label: 'PENDING', _data: 'PENDING' }, ...]
 * ```
 */
export function arrayToOptions<TItem extends StringOrNumber>(
	items: Array<TItem> | null | undefined,
): Array<Option<TItem, TItem>>

/**
 * Converts an array of complex objects into an array of `Option` objects
 * through provided extractor functions.
 *
 * @example
 * ```ts
 * const users = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' }
 * ]
 *
 * const options = arrayToOptions({
 *   items: users,
 *   getValue: (u) => u.id,
 *   getLabel: (u) => u.name,
 * })
 * // Output: [{ value: 1, label: 'Alice', _data: { id: 1, name: 'Alice' } }, ...]
 * ```
 */
export function arrayToOptions<TItem, TValue extends StringOrNumber>(params: {
	items: Array<TItem> | null | undefined
	getValue: (item: TItem) => TValue
	getLabel: (item: TItem) => string
}): Array<Option<TValue, TItem>>

export function arrayToOptions(itemsOrParams: any): Array<Option<any>> {
	if (!itemsOrParams) return []

	// Handle direct primitive array payload
	if (Array.isArray(itemsOrParams)) {
		return itemsOrParams.map((item) => ({
			value: item,
			label: String(item),
			_data: item,
		}))
	}

	// Handle extractor function payload: { items, getValue, getLabel }
	const { items, getValue, getLabel } = itemsOrParams
	if (!items || !Array.isArray(items)) return []

	return items.map((item: any) => ({
		value: getValue(item),
		label: getLabel(item),
		_data: item,
	}))
}

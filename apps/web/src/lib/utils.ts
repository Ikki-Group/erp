import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { OptionsWithData, StringOrNumber } from '@/types/common'
import type { ClassValue } from 'clsx'

export type { StringOrNumber }

export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs))
}

/**
 * Convert array of items to options with data
 * @example
 * const options = toOptions(
 *   [
 *     { id: 1, name: 'John Doe' },
 *     { id: 2, name: 'Jane Doe' },
 *   ],
 *   item => item.id,
 *   item => item.name
 * )
 */
export function toOptions<TItem, TValue extends StringOrNumber>(
	data: Array<TItem>,
	getValue: (item: TItem) => TValue,
	getLabel: (item: TItem) => string,
): OptionsWithData<TValue, TItem> {
	return data.map((item) => ({ label: getLabel(item), value: getValue(item), data: item }))
}

/* -------------------------------------------------------------------------- */
/*  Option type & arrayToOptions (migrated from @/lib/options)               */
/* -------------------------------------------------------------------------- */

export interface SelectOption<TValue extends StringOrNumber = string, TData = any> {
	value: TValue
	label: string
	_data: TData
}

export function arrayToOptions<TItem extends StringOrNumber>(
	items: Array<TItem> | null | undefined,
): Array<SelectOption<TItem, TItem>>

export function arrayToOptions<TItem, TValue extends StringOrNumber>(params: {
	items: Array<TItem> | null | undefined
	getValue: (item: TItem) => TValue
	getLabel: (item: TItem) => string
}): Array<SelectOption<TValue, TItem>>

export function arrayToOptions(itemsOrParams: any): Array<SelectOption<any>> {
	if (!itemsOrParams) return []

	if (Array.isArray(itemsOrParams)) {
		return itemsOrParams.map((item) => ({
			value: item,
			label: String(item),
			_data: item,
		}))
	}

	const { items, getValue, getLabel } = itemsOrParams
	if (!items || !Array.isArray(items)) return []

	return items.map((item: any) => ({
		value: getValue(item),
		label: getLabel(item),
		_data: item,
	}))
}

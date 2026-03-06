import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'
import type { OptionsWithData, StringOrNumber } from '@/types/common'

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
  getLabel: (item: TItem) => string
): OptionsWithData<TValue, TItem> {
  return data.map(item => ({
    label: getLabel(item),
    value: getValue(item),
    data: item,
  }))
}

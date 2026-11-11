import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

/** Standard date time format: 04-03-2026, 10:52 */
export function toDateTimeStamp(date: Date | string | number): string {
	if (!date) return '-'
	return format(new Date(date), 'dd-MM-yyyy, HH:mm')
}

/** Date only format: 04-03-2026 */
export function toDate(date: Date | string | number): string {
	if (!date) return '-'
	return format(new Date(date), 'dd-MM-yyyy')
}

/** Relative time: 2 jam yang lalu */
export function toRelativeTime(date: Date | string | number): string {
	if (!date) return '-'
	return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
}

/** Currency formatter (IDR): Rp 1.000.000 */
export function toCurrency(value: number | string): string {
	const num = typeof value === 'string' ? Number.parseFloat(value) : value
	if (Number.isNaN(num)) return '-'

	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num)
}

/** Number formatter: 1.000.000 */
export function toNumber(value: number | string): string {
	const num = typeof value === 'string' ? Number.parseFloat(value) : value
	if (Number.isNaN(num)) return '-'

	return new Intl.NumberFormat('id-ID').format(num)
}

/** Code case formatter (Screaming Snake Case): "Dine In" -> "DINE_IN" */
export function toCodeCase(str: string): string {
	return (
		str
			.match(/[a-z0-9]+/gi)
			?.map((word) => word.toUpperCase())
			.join('_') ?? ''
	)
}

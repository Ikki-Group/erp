/**
 * Simple utilities to replace date-fns for Moka crawler
 */

export function formatDate(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

export function eachDayOfInterval(start: Date, end: Date): Date[] {
	const dates: Date[] = []
	const current = new Date(start)
	current.setHours(0, 0, 0, 0)
	const last = new Date(end)
	last.setHours(0, 0, 0, 0)

	// oxlint-disable-next-line no-unmodified-loop-condition
	while (current <= last) {
		dates.push(new Date(current))
		current.setDate(current.getDate() + 1)
	}

	return dates
}

export function expandDates(start: Date, end?: Date): string[] {
	if (!end) return [formatDate(start)]
	return eachDayOfInterval(start, end).map(formatDate)
}

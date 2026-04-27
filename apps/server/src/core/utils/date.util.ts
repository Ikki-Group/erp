/**
 * WIB (UTC+7) timezone helpers for daily stock summary boundaries.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * Get the UTC boundaries of a WIB calendar date.
 * E.g. 2026-03-03 WIB → { start: 2026-03-02T17:00Z, end: 2026-03-03T17:00Z }
 */
export function toWibDayBounds(date: Date): { start: Date; end: Date } {
	const wib = new Date(date.getTime() + WIB_OFFSET_MS)
	const y = wib.getUTCFullYear()
	const m = wib.getUTCMonth()
	const d = wib.getUTCDate()

	return {
		start: new Date(Date.UTC(y, m, d) - WIB_OFFSET_MS),
		end: new Date(Date.UTC(y, m, d + 1) - WIB_OFFSET_MS),
	}
}

/**
 * Returns a Date at midnight UTC representing the WIB calendar date.
 * Used as the canonical `date` key in stock_summaries.
 */
export function toWibDateKey(date: Date): Date {
	const wib = new Date(date.getTime() + WIB_OFFSET_MS)
	return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()))
}

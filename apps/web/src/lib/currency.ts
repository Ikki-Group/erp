/**
 * Shared canonical/display conversion for Indonesian Rupiah amounts —
 * used by both the form-bound `CurrencyField` (`@/lib/form/fields/currency-field`)
 * and the standalone `CurrencyInput` (`@/components/shared/currency-input`)
 * for money inputs that live outside the `useEntityForm` engine (e.g. POS
 * checkout's ad hoc payment-entry state).
 *
 * The canonical form is the numeric string every money DTO expects
 * (`/^\d+(\.\d+)?$/`, e.g. `'82340.5'`) — never the displayed
 * thousands-grouped, comma-decimal Indonesian notation (`'82.340,5'`).
 */

/**
 * Strips everything except digits and a single ',' (the Indonesian decimal
 * separator) from what the user typed, and normalizes it to the canonical
 * '.'-decimal numeric string. `'82.340,50'` (as displayed) → `'82340.50'`
 * (as stored).
 */
export function toCanonicalCurrency(display: string): string {
	let cleaned = display.replace(/[^0-9,]/g, '')
	const firstComma = cleaned.indexOf(',')
	if (firstComma !== -1) {
		cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replaceAll(',', '')
	}
	return cleaned.replace(',', '.')
}

/** `'82340.5'` → `'82.340,5'` — grouped thousands, comma decimal, id-ID style. */
export function toDisplayCurrency(canonical: string): string {
	if (!canonical) return ''
	const [intPart = '', decPart] = canonical.split('.')
	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/gu, '.')
	return decPart === undefined ? grouped : `${grouped},${decPart}`
}

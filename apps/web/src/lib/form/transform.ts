/**
 * Conversions at the form/API boundary. Form fields (`SelectField`,
 * `ComboboxField`, `NumberField`-as-id) always store ids as strings — this
 * keeps every field's value type uniform and Base UI-compatible. Convert
 * back to `number | null` only at the point a payload is built for a
 * mutation, using these two helpers everywhere that happens.
 */

/** `'12'` → `12`. Empty string, `undefined` → `null`. */
export function toId(value: string | undefined): number | null {
	if (!value) return null
	const num = Number(value)
	return Number.isNaN(num) ? null : num
}

/** `12` → `'12'`. `null`/`undefined` → `''`. */
export function idToString(value: number | null | undefined): string {
	return value === null || value === undefined ? '' : String(value)
}

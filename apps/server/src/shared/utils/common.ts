/**
 * Convert a single value to an array, or keep it as-is if it is already an array.
 */
export function toArray<T>(val: T): T extends any[] ? T : T[] {
	// oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-type-assertion
	return (Array.isArray(val) ? val : [val]) as any
}

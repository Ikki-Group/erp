import type { StandardSchemaV1Issue } from '@tanstack/react-form'

/** A single field's error state, however TanStack Form happened to shape it. */
export type FieldErrors = ReadonlyArray<string | StandardSchemaV1Issue | undefined>

/**
 * Renders `field.state.meta.errors` as one string. TanStack Form errors are
 * either plain strings (function validators) or `StandardSchemaV1Issue`
 * objects (Zod/Standard Schema validators) — this is the one place that
 * knows how to flatten either shape, so field components never have to.
 *
 * `useEntityForm` runs the same schema on both `onChange` and `onSubmit`
 * (see its doc comment), so the same issue can land in this array twice —
 * once per cause. Deduped here rather than by dropping one of the two
 * validators, since both are needed (live feedback while typing, and a
 * final check on submit for untouched fields).
 */
export function formatFieldError(errors: FieldErrors | undefined): string | undefined {
	if (!errors || errors.length === 0) return undefined

	const messages = errors
		.map((error) => {
			if (!error) return undefined
			if (typeof error === 'string') return error
			return error.message
		})
		.filter((message): message is string => !!message)

	return messages.length > 0 ? Array.from(new Set(messages)).join(', ') : undefined
}

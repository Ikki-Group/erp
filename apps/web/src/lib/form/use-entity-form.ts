import type { ZodTypeAny } from 'zod'

import { isApiError } from '@/lib/api/errors.ts'

import { useAppForm } from './app-form.ts'

export interface UseEntityFormOptions<TValues> {
	/** Initial field values. Pass the entity being edited, mapped to form shape — or an empty-record default for create mode. */
	defaultValues: TValues
	/**
	 * Validated on every change and on submit (Zod schemas work directly as
	 * Standard Schema validators — no adapter needed). Deliberately untyped
	 * against `TValues`: the DTO's *validated output* shape (numbers coerced,
	 * nullable defaults applied) is usually narrower than the *form* shape
	 * (e.g. a required `number` field starts as `null` before the user
	 * picks a value) — form values are passed to `onSubmit` as-entered, not
	 * as the schema's parsed output. See `docs/web/06-ui-patterns.md`.
	 */
	schema: ZodTypeAny
	/**
	 * Called with the validated values once the schema passes. Throw (or let
	 * a mutation's promise reject) to keep the form open with a submit
	 * error — `useEntityForm` catches it, extracts a message via
	 * `ApiError.friendlyMessage` when available, and surfaces it through
	 * `form.AppForm`'s `<form.FormError />`.
	 */
	onSubmit: (values: TValues) => Promise<void>
}

/**
 * The one form hook every entity create/update form in the app should use.
 * Wraps `useAppForm` with the two things that are always the same:
 *
 * 1. Schema validation on `onChange`+`onSubmit` (Zod schemas work directly —
 *    no adapter needed, TanStack Form speaks Standard Schema natively).
 * 2. A submit boundary that turns a thrown/rejected mutation into a
 *    form-level error instead of an unhandled rejection.
 *
 * A form built on this hook only needs to describe its fields and its
 * mutation — nothing else is boilerplate:
 *
 * ```tsx
 * const form = useEntityForm({
 *   defaultValues: toFormValues(material),
 *   schema: MaterialUpsertDto,
 *   onSubmit: async (values) => {
 *     await mutation.mutateAsync(values)
 *   },
 * })
 * ```
 */
export function useEntityForm<TValues>({
	defaultValues,
	schema,
	onSubmit,
}: UseEntityFormOptions<TValues>) {
	return useAppForm({
		defaultValues,
		// `schema` is intentionally a loosely-typed `ZodTypeAny` (see the
		// option's doc comment) — TanStack Form's validator generics expect
		// a `StandardSchemaV1<TValues, ...>`, which is stricter than any
		// single schema type can satisfy across every call site. The cast
		// is safe: the schema still runs and its issues still map to the
		// matching field by name.
		validators: { onChange: schema, onSubmit: schema } as never,
		onSubmit: async ({ value, formApi }) => {
			try {
				await onSubmit(value)
			} catch (error) {
				const message = isApiError(error)
					? error.friendlyMessage
					: error instanceof Error
						? error.message
						: 'An unexpected error occurred.'
				formApi.setErrorMap({ onSubmit: { form: message, fields: {} } })
			}
		},
	})
}

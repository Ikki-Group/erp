import { useEffect, useRef, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'

import { toast } from '@/components/ui/toast'

import { useEntityForm } from './use-entity-form'
import type { EntityForm } from './use-entity-form'
import type { ZodTypeAny } from 'zod'

interface UseEntityEditorOptions<TValues extends object, TPayload, TResult> {
	defaultValues: TValues
	schema: ZodTypeAny
	mutation: UseMutationOptions<TResult, Error, TPayload>
	toPayload: (values: TValues) => TPayload
	successMessage: string
	/** Runs after a successful save (typically navigation). Omit for an on-page editor. */
	onSaved?: () => void | Promise<void>
	/**
	 * Opt in to staying on the page after a save: maps what was saved to the new
	 * form baseline. Top-level fields edited while the request was in flight keep
	 * their draft (compared by identity against what was submitted, no deep merge, so
	 * values must be treated as immutable and flat) and stay unsaved against this baseline.
	 */
	baselineAfterSave?: (payload: TPayload, result: TResult) => TValues
	mapError?: (error: unknown) => unknown
}

/** Owns the editing session, not entity policy. Remount with an entity key to start a different session. */
export function useEntityEditor<TValues extends object, TPayload, TResult>({
	defaultValues,
	schema,
	mutation,
	toPayload,
	successMessage,
	onSaved,
	baselineAfterSave,
	mapError,
}: UseEntityEditorOptions<TValues, TPayload, TResult>): EntityForm<TValues> {
	// Query refreshes must not replace the baseline of an in-progress edit; only a save does.
	const [baseline, setBaseline] = useState(() => defaultValues)
	const save = useMutation(mutation)
	const formRef = useRef<EntityForm<TValues> | null>(null)
	const form = useEntityForm({
		defaultValues: baseline,
		schema,
		onSubmit: async (values) => {
			const payload = toPayload(values)
			let result: TResult
			try {
				result = await save.mutateAsync(payload)
			} catch (error) {
				throw mapError ? mapError(error) : error
			}
			toast.add({ title: successMessage, type: 'success' })
			if (baselineAfterSave) {
				const next = baselineAfterSave(payload, result)
				setBaseline(next)
				rebase(formRef.current, values, next)
			}
			await onSaved?.()
		},
	})
	useEffect(() => {
		formRef.current = form
	}, [form])
	return form
}

function rebase<TValues extends object>(
	form: EntityForm<TValues> | null,
	submitted: TValues,
	next: TValues,
) {
	if (!form) return
	const draft = form.state.values
	const merged = { ...next }
	let edited = false
	for (const key of Object.keys(draft) as (keyof TValues)[]) {
		if (!Object.is(draft[key], submitted[key])) {
			merged[key] = draft[key]
			edited = true
		}
	}
	form.reset(next)
	if (edited) form.reset(merged, { keepDefaultValues: true })
}

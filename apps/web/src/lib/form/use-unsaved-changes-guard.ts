import { useEffect, useRef } from 'react'

import { useStore } from '@tanstack/react-form'
import type { AnyFormApi } from '@tanstack/react-form'
import { useBlocker } from '@tanstack/react-router'

import { confirm } from '@/components/shared/confirm'

type FormState = AnyFormApi['store']['state']

/**
 * A form has unsaved changes when its values differ from the current baseline
 * and no submit is in flight. `isSubmitting` — not `isSubmitSuccessful` —
 * marks "this navigation was triggered by our own successful submit": a route's
 * `onSubmit` typically calls `navigate()` inside the callback, before TanStack
 * flips `isSubmitSuccessful`.
 *
 * After a successful submit the values are saved only if they are still the
 * exact object that was submitted. `isSubmitSuccessful` stays true until the
 * next submit, so without this identity check any later edit would be ignored.
 * An on-page editor that rebases after saving replaces the values object and
 * the baseline, so it is judged by dirtiness alone.
 * Submission errors live in errorMap because useEntityForm catches rejections;
 * they always count as unsaved.
 */
function hasUnsavedChanges(state: FormState, submittedValues: unknown): boolean {
	if (state.isSubmitting) return false
	if (!state.isDirty && state.isDefaultValue) return false
	if (state.errorMap.onSubmit !== undefined) return true
	return !(state.isSubmitSuccessful && state.values === submittedValues)
}

/**
 * Blocks in-app navigation and the browser tab close/refresh while `form`
 * has unsaved changes. One hook call at the top of a full-page form
 * replaces the manual `beforeunload` listener + dirty-tracking `useState`
 * that every such page used to hand-roll (see the old `settings/company.tsx`
 * for the pattern this replaces). Router navigation is blocked with the
 * standard `confirm()` dialog (`components/shared/confirm.tsx`) — the same
 * styled dialog used everywhere else, not the browser's native `confirm()`;
 * tab close/reload still falls back to the browser's own "leave site?"
 * dialog via `enableBeforeUnload`, since that one can't be replaced.
 */
export function useUnsavedChangesGuard(form: AnyFormApi): void {
	// Values at the moment the latest submit began: what a success would save.
	const submittedValues = useRef<unknown>(undefined)
	useEffect(() => {
		let submitting = form.store.state.isSubmitting
		const subscription = form.store.subscribe(() => {
			const state = form.store.state
			if (state.isSubmitting && !submitting) submittedValues.current = state.values
			submitting = state.isSubmitting
		})
		return () => subscription.unsubscribe()
	}, [form])

	// Subscribed only so `enableBeforeUnload` (which TanStack Router re-reads
	// on every render) stays current — the actual navigation decision below
	// reads the store directly instead of this closure.
	useStore(form.store, (state) => hasUnsavedChanges(state, submittedValues.current))

	useBlocker({
		shouldBlockFn: async () => {
			// Read live, not the value closed over at the last render — see
			// `hasUnsavedChanges`'s doc comment for why this matters.
			if (!hasUnsavedChanges(form.store.state, submittedValues.current)) return false
			const leave = await confirm({
				title: 'Unsaved changes',
				description: 'You have unsaved changes. Leave this page without saving?',
				confirmLabel: 'Leave',
				cancelLabel: 'Stay',
				variant: 'destructive',
			})
			return !leave
		},
		enableBeforeUnload: () => hasUnsavedChanges(form.store.state, submittedValues.current),
	})
}

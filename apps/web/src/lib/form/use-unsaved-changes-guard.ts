import { useStore } from '@tanstack/react-form'
import type { AnyFormApi } from '@tanstack/react-form'
import { useBlocker } from '@tanstack/react-router'

/**
 * Reads the form's *current* dirty/submitting state, bypassing React's
 * render cycle. `isSubmitting` — not `isSubmitSuccessful` — is what marks
 * "this navigation was triggered by our own successful submit": TanStack
 * Form only flips `isSubmitSuccessful` to `true` *after* the `onSubmit`
 * callback resolves, but a route's `onSubmit` typically calls `navigate()`
 * as the last statement *inside* that same callback — before it resolves.
 * `isSubmitting`, by contrast, is `true` for the callback's entire
 * duration, so it reliably distinguishes "still submitting (possibly about
 * to navigate on success)" from "user is trying to leave with unsaved
 * edits and no submit in flight".
 */
function readHasUnsavedChanges(form: AnyFormApi): boolean {
	const state = form.store.state
	return state.isDirty && !state.isSubmitting && !state.isSubmitSuccessful
}

/**
 * Blocks in-app navigation and the browser tab close/refresh while `form`
 * has unsaved changes. One hook call at the top of a full-page form
 * replaces the manual `beforeunload` listener + dirty-tracking `useState`
 * that every such page used to hand-roll (see the old `settings/company.tsx`
 * for the pattern this replaces). Router navigation is blocked with a
 * native `confirm()` prompt; tab close/reload falls back to the browser's
 * own "leave site?" dialog via `enableBeforeUnload`.
 */
export function useUnsavedChangesGuard(form: AnyFormApi): void {
	// Subscribed only so `enableBeforeUnload` (which TanStack Router re-reads
	// on every render) stays current — the actual navigation decision below
	// reads the store directly instead of this closure, see the comment there.
	useStore(form.store, (state) => state.isDirty && !state.isSubmitting && !state.isSubmitSuccessful)

	useBlocker({
		shouldBlockFn: () => {
			// Read live, not the value closed over at the last render — see
			// `readHasUnsavedChanges`'s doc comment for why this matters.
			if (!readHasUnsavedChanges(form)) return false
			return !window.confirm('You have unsaved changes. Leave this page?')
		},
		enableBeforeUnload: () => readHasUnsavedChanges(form),
	})
}

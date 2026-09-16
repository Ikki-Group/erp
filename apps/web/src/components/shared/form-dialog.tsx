import { useState } from 'react'
import type { ReactNode } from 'react'

import { createCallable } from 'react-call'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

export interface FormDialogHelpers {
	/** Closes the dialog. `formDialog(...)` resolves to this value (default `false`, i.e. cancelled). */
	close: (result?: boolean) => void
}

interface FormDialogPropsBase {
	title: string
	description?: string
	/** Extra classes for the dialog's max-width, e.g. `'sm:max-w-lg'` for forms with more fields. */
	className?: string
}

export interface FormDialogRenderProps extends FormDialogPropsBase {
	/**
	 * Renders the dialog body. Receives `close` so the content decides when
	 * the dialog is done — after a mutation succeeds, on a "Done" click,
	 * whatever fits. The content owns its own footer buttons (typically
	 * `FormDialogFooter` from `@/lib/form`); `FormDialog` has no opinion on
	 * Save/Cancel/Done because not every dialog is a save form (e.g. a
	 * toggle-list picker just needs "Done"). This is the current pattern —
	 * prefer it for any new dialog.
	 */
	content: (helpers: FormDialogHelpers) => ReactNode
	onSubmit?: never
	submitLabel?: never
	cancelLabel?: never
}

export interface FormDialogLegacyProps extends FormDialogPropsBase {
	/**
	 * @deprecated Static content with a separate `onSubmit` is the pre-form-engine
	 * pattern (still used by several pages pending migration — see
	 * `docs/web/06-ui-patterns.md`). New dialogs should use the render-prop
	 * `content` form (`FormDialogRenderProps`) instead, where the content
	 * owns its own form and footer.
	 */
	content: ReactNode
	submitLabel?: string
	cancelLabel?: string
	onSubmit: () => Promise<void>
}

export type FormDialogProps = FormDialogRenderProps | FormDialogLegacyProps

type FormDialogResponse = boolean

const UNMOUNTING_DELAY = 150

function isRenderProp(
	content: FormDialogProps['content'],
): content is FormDialogRenderProps['content'] {
	return typeof content === 'function'
}

export const FormDialog = createCallable<FormDialogProps, FormDialogResponse>(
	({ call, title, description, content, className, onSubmit, submitLabel, cancelLabel }) => {
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)
		const close = (result = false) => call.end(result)

		const handleLegacySubmit = async () => {
			if (!onSubmit) return
			setLoading(true)
			setError(null)
			try {
				await onSubmit()
				close(true)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'An error occurred.')
				setLoading(false)
			}
		}

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open && !loading) close(false)
				}}
			>
				<DialogContent className={cn('sm:max-w-md', className)}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>

					{isRenderProp(content) ? (
						content({ close })
					) : (
						<>
							<div className="py-2">{content}</div>
							{error && (
								<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
									{error}
								</p>
							)}
							<DialogFooter>
								<Button variant="outline" onClick={() => close(false)} disabled={loading}>
									{cancelLabel ?? 'Cancel'}
								</Button>
								<Button onClick={handleLegacySubmit} disabled={loading}>
									{loading && <Spinner className="mr-1.5 size-3.5" />}
									{submitLabel ?? 'Save'}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		)
	},
	UNMOUNTING_DELAY,
)

/**
 * Imperative dialog for lightweight content — quick-add forms with a
 * handful of fields, toggle pickers, anything not worth leaving the list
 * page for. Prefer a full-page form (`@/components/shared/form-page`) for
 * anything larger; see `docs/web/06-ui-patterns.md`.
 *
 * Resolves `true` when `close(true)` is called (typically: mutation
 * succeeded), `false` otherwise (cancelled, backdrop click, Escape).
 *
 * @example
 * ```tsx
 * const saved = await formDialog({
 *   title: 'Add Category',
 *   description: 'Create a new material category.',
 *   content: ({ close }) => <CategoryQuickForm onSaved={() => close(true)} />,
 * })
 * if (saved) toast.add({ title: 'Category created.', type: 'success' })
 * ```
 *
 * Where `CategoryQuickForm` owns its own `useEntityForm` + footer:
 * ```tsx
 * function CategoryQuickForm({ onSaved }: { onSaved: () => void }) {
 *   const createMut = useMutation(categoryResource.create.mutationOptions())
 *   const form = useEntityForm({
 *     defaultValues: { name: '' },
 *     schema: MaterialCategoryCreateDto,
 *     onSubmit: async (values) => {
 *       await createMut.mutateAsync(values)
 *       onSaved()
 *     },
 *   })
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
 *       <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
 *       <form.FormError />
 *       <FormDialogFooter onCancel={...} />
 *     </form>
 *   )
 * }
 * ```
 */
export const formDialog = FormDialog.call

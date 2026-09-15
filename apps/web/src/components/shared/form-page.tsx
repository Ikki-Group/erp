import type { ReactNode } from 'react'

import { useStore } from '@tanstack/react-form'
import type { AnyFormApi } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface FormPageProps {
	title: string
	description?: string
	/** The form instance driving this page — submitting/canSubmit state is read from it automatically. */
	form: AnyFormApi
	/** Extra actions rendered next to the primary submit button (e.g. "Delete"). */
	actions?: ReactNode
	/** The form body — field groups, sections, whatever the entity needs. */
	children: ReactNode
	onCancel?: () => void
	submitLabel?: string
	cancelLabel?: string
	className?: string
}

/**
 * The standard layout for a full-page create/edit form: back button, title,
 * body, and a sticky footer with cancel/submit. This is the *default* shape
 * for entity forms per the design decision — reach for `FormDialog`
 * (`@/components/shared/form-dialog`) only for genuinely lightweight,
 * few-field cases (quick-add, toggles) that don't warrant leaving the list
 * page.
 *
 * Pair with a form built on `useEntityForm` (`@/lib/form/use-entity-form`)
 * and `useUnsavedChangesGuard(form)` for the back-navigation confirm:
 *
 * ```tsx
 * function NewMaterialPage() {
 *   const form = useMaterialForm({ onSubmit: ... })
 *   useUnsavedChangesGuard(form)
 *
 *   return (
 *     <form.AppForm>
 *       <FormPage
 *         title="Add Material"
 *         form={form}
 *         onCancel={() => navigate({ to: '/master/materials' })}
 *       >
 *         <MaterialFormFields form={form} />
 *       </FormPage>
 *     </form.AppForm>
 *   )
 * }
 * ```
 */
export function FormPage({
	title,
	description,
	form,
	actions,
	children,
	onCancel,
	submitLabel = 'Save',
	cancelLabel = 'Cancel',
	className,
}: FormPageProps) {
	const router = useRouter()
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
	const canSubmit = useStore(form.store, (state) => state.canSubmit)

	const handleCancel = () => {
		if (onCancel) {
			onCancel()
			return
		}
		router.history.back()
	}

	return (
		<div className={cn('mx-auto max-w-2xl space-y-6 pb-20', className)}>
			<div className="space-y-1">
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={handleCancel}>
					<ArrowLeftIcon className="size-3.5" />
					{cancelLabel}
				</Button>
				<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="space-y-6"
			>
				{children}

				<div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-2 border-t bg-background/95 px-2 py-4 backdrop-blur">
					{actions}
					<Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
						{cancelLabel}
					</Button>
					<Button type="submit" disabled={isSubmitting || !canSubmit}>
						{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
						{submitLabel}
					</Button>
				</div>
			</form>
		</div>
	)
}

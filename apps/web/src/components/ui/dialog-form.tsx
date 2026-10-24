import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

interface DialogFormProps extends React.ComponentPropsWithRef<typeof Dialog> {
	/** Dialog title */
	title: string
	/** Optional description under the title */
	description?: string
	/** Form content — not rendered when isLoading is true */
	children: ReactNode
	/** Show skeleton loading state */
	isLoading?: boolean
	/** Number of skeleton fields to show during loading — defaults to 3 */
	skeletonFields?: number
	/** Footer buttons — typically submit/cancel. Not shown during loading. */
	footer?: ReactNode
	/** Show close button in header */
	showCloseButton?: boolean
	/** Custom dialog content classname */
	contentClassName?: string
	/** Custom header classname */
	headerClassName?: string
}

/**
 * Reusable form dialog wrapper with built-in skeleton loading state.
 *
 * Usage:
 * ```tsx
 * <DialogForm open={open} onOpenChange={setOpen} title="Edit Material" isLoading={isLoading}>
 *   <form className="grid gap-4">
 *     <field.TextField name="code" label="Code" />
 *     <field.TextField name="name" label="Name" />
 *   </form>
 *   <DialogFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button type="submit" form="material-form">Save</Button>
 *   </DialogFooter>
 * </DialogForm>
 * ```
 *
 * When `isLoading={true}`:
 * - Form content is hidden
 * - 3 skeleton placeholders appear (customizable via `skeletonFields`)
 * - Footer is hidden
 * - Close button remains visible for cancellation
 */
function DialogForm({
	title,
	description,
	children,
	isLoading = false,
	skeletonFields = 3,
	footer,
	showCloseButton = true,
	contentClassName,
	headerClassName,
	...props
}: DialogFormProps) {
	return (
		<Dialog {...props}>
			<DialogContent showCloseButton={showCloseButton} className={contentClassName}>
				<DialogHeader className={headerClassName}>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-3">
						{Array.from({ length: skeletonFields }).map((_, i) => (
							<div key={i} className="space-y-1.5">
								<Skeleton className="h-4 w-20 rounded" />
								<Skeleton className="h-9 w-full rounded-md" />
							</div>
						))}
					</div>
				) : (
					<div className="max-h-[60vh] overflow-y-auto">{children}</div>
				)}

				{!isLoading && footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	)
}

/**
 * Skeleton field placeholder for form dialogs.
 * Use inside DialogForm when creating custom loading states.
 *
 * Usage:
 * ```tsx
 * <DialogFormFieldSkeleton label="Material Code" />
 * <DialogFormFieldSkeleton label="Description" count={2} />
 * ```
 */
function DialogFormFieldSkeleton({
	label,
	count = 1,
	className,
}: {
	label?: string
	count?: number
	className?: string
}) {
	return (
		<div className={cn('space-y-1.5', className)}>
			{label && <Skeleton className="h-4 w-24 rounded" />}
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} className="h-9 w-full rounded-md" />
			))}
		</div>
	)
}

export { DialogForm, DialogFormFieldSkeleton }
export type { DialogFormProps }

import { createFileRoute } from '@tanstack/react-router'

import {
	EmptyState,
	InlineAlert,
	InlineTip,
	PageError,
	PageHeader,
	PageSection,
	PageSkeleton,
} from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'

export const Route = createFileRoute('/design-system/feedback')({
	component: FeedbackPage,
})

function FeedbackPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Feedback"
				description="Loading, empty, and error states, plus inline and transient (toast) messaging. Every query-backed table needs the first three — see docs/web/07-design-system.md."
			/>

			{/* ─── INLINE ALERTS ─── */}
			<PageSection title="Inline Alerts" description="Contextual messages within forms/pages.">
				<div className="max-w-lg space-y-3">
					<InlineAlert variant="info" title="Info">
						Transfer request has been sent to the warehouse.
					</InlineAlert>
					<InlineAlert variant="success" title="Success">
						Material created successfully.
					</InlineAlert>
					<InlineAlert variant="warning" title="Low Stock">
						Stock is below minimum threshold. Consider reordering.
					</InlineAlert>
					<InlineAlert variant="error" title="Error">
						Failed to save. Please check your connection and try again.
					</InlineAlert>
				</div>
			</PageSection>

			<Separator />

			{/* ─── INLINE TIP ─── */}
			<PageSection
				title="Inline Tip"
				description="Compact one-line field/section guidance — lighter-weight than Inline Alert (no separate title/body split), for a note that doesn't need its own block."
			>
				<div className="max-w-lg space-y-2">
					<InlineTip>Stock is calculated per-location. Transfer to move between stores.</InlineTip>
					<InlineTip variant="success">Auto-saved 2 minutes ago.</InlineTip>
					<InlineTip variant="warning">This action cannot be undone.</InlineTip>
					<InlineTip variant="error">This code is already used by another material.</InlineTip>
				</div>
			</PageSection>

			<Separator />

			{/* ─── TOAST ─── */}
			<PageSection
				title="Toast"
				description="Transient success feedback after a mutation — the only use of toast in this app's convention. Mutation errors surface inline (FormError/PageError), never as a toast. toast.promise()/a manual loading→update toast are for long-running background work (file processing, exports) where the mutation itself doesn't block the UI."
			>
				<div className="flex flex-wrap gap-3">
					<Button
						size="sm"
						onClick={() => toast.add({ title: 'Material created successfully.', type: 'success' })}
					>
						Trigger success toast
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => toast.add({ title: 'Something went wrong.', type: 'error' })}
					>
						Trigger error toast
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							const id = toast.add({
								title: 'Exporting report...',
								type: 'loading',
								timeout: 0,
							})
							window.setTimeout(() => {
								toast.update(id, { title: 'Report exported.', type: 'success', timeout: 5000 })
							}, 2000)
						}}
					>
						Trigger loading → success toast
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							const fakeRequest = new Promise<void>((resolve, reject) => {
								window.setTimeout(() => {
									if (Math.random() > 0.3) resolve()
									else reject(new Error('Network error'))
								}, 2000)
							})
							void toast.promise(fakeRequest, {
								loading: 'Saving material...',
								success: 'Material saved successfully.',
								error: (err: unknown) =>
									`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`,
							})
						}}
					>
						Trigger promise toast (random success/fail)
					</Button>
				</div>
			</PageSection>

			<Separator />

			{/* ─── EMPTY STATE ─── */}
			<PageSection title="Empty State" description="When a list has no items.">
				<EmptyState
					title="No materials yet"
					description="Add your first material to get started."
					action={<Button size="sm">Add Material</Button>}
				/>
			</PageSection>

			<Separator />

			{/* ─── PAGE ERROR ─── */}
			<PageSection
				title="Page Error"
				description="Route-level / table-level error display, always paired with a Retry action."
			>
				<PageError
					title="Failed to load materials"
					message="Could not connect to the server. Please check your connection."
					onRetry={() => {}}
				/>
			</PageSection>

			<Separator />

			{/* ─── PAGE SKELETON ─── */}
			<PageSection title="Page Skeleton" description="Loading state for pages and tables.">
				<PageSkeleton />
			</PageSection>
		</div>
	)
}

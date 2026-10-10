import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { confirm, formDialog, PageHeader, PageSection } from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const Route = createFileRoute('/design-system/overlays')({
	component: OverlaysPage,
})

function OverlaysPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Overlays"
				description="Dialogs, confirmations, tooltips, and popovers — floating UI layered above the page."
			/>

			{/* ─── CONFIRM (react-call) ─── */}
			<PageSection
				title="Confirm"
				description="Imperative awaitable confirm dialog. No state management needed."
			>
				<div className="flex flex-wrap gap-3">
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							const accepted = await confirm({
								title: 'Delete material?',
								description:
									'This action cannot be undone. The material will be permanently removed.',
								confirmLabel: 'Delete',
								variant: 'destructive',
							})
							if (accepted) alert('Deleted!')
						}}
					>
						Simple confirm
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							const accepted = await confirm({
								title: 'Approve transfer?',
								description: 'Once approved, stock will be deducted from the source location.',
								confirmLabel: 'Approve',
								onConfirm: async () => {
									// oxlint-disable-next-line no-promise-executor-return
									await new Promise((r) => setTimeout(r, 2000))
								},
							})
							if (accepted) alert('Approved!')
						}}
					>
						Async confirm (2s delay)
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							const accepted = await confirm({
								title: 'Delete with error?',
								description: 'This will simulate a failed async action.',
								confirmLabel: 'Delete',
								variant: 'destructive',
								onConfirm: async () => {
									// oxlint-disable-next-line no-promise-executor-return
									await new Promise((r) => setTimeout(r, 1000))
									throw new Error('Network error: could not reach server')
								},
							})
							if (accepted) alert('Deleted!')
						}}
					>
						Async confirm (fails)
					</Button>
				</div>
			</PageSection>

			<Separator />

			{/* ─── CONFIRM INPUT (react-call) ─── */}
			<PageSection
				title="Confirm Input"
				description="Requires typing a confirmation word before the action can proceed."
			>
				<div className="flex flex-wrap gap-3">
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							const accepted = await confirm({
								title: 'Delete "Coffee Beans"?',
								description:
									'This action is permanent and cannot be undone. All stock records will be removed.',
								requireText: 'Coffee Beans',
								confirmLabel: 'Delete permanently',
							})
							if (accepted) alert('Deleted!')
						}}
					>
						Simple input confirm
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							const accepted = await confirm({
								title: 'Delete "Coffee Beans"?',
								description: 'This will simulate an async deletion with loading state.',
								requireText: 'Coffee Beans',
								confirmLabel: 'Delete permanently',
								onConfirm: async () => {
									// oxlint-disable-next-line no-promise-executor-return
									await new Promise((r) => setTimeout(r, 2000))
								},
							})
							if (accepted) alert('Deleted!')
						}}
					>
						Async input confirm (2s)
					</Button>
				</div>
			</PageSection>

			<Separator />

			{/* ─── FORM DIALOG (react-call) ─── */}
			<PageSection
				title="Form Dialog"
				description="Imperative form modal with async submit. Header/footer are tinted bands separated from the body by a divider — see components/ui/dialog.tsx."
			>
				<Button
					size="sm"
					onClick={async () => {
						const saved = await formDialog({
							title: 'Quick Add Material',
							description: 'Add a new material to your inventory.',
							// oxlint-disable-next-line react/no-unstable-nested-components
							content: ({ close }) => <QuickAddMaterialDialogBody onDone={close} />,
						})
						if (saved) alert('Material saved!')
					}}
				>
					Open Form Dialog
				</Button>
			</PageSection>

			<Separator />

			{/* ─── UNSAVED CHANGES DIALOG ─── */}
			<PageSection
				title="Unsaved Changes Dialog"
				description="Confirms before navigating away from a dirty form — the same styled confirm() dialog as above, not the browser's native prompt. Real pages get this for free from useUnsavedChangesGuard(form) (lib/form/use-unsaved-changes-guard.ts), which wires it to router navigation and tab close."
			>
				<UnsavedChangesDemo />
			</PageSection>

			<Separator />

			{/* ─── TOOLTIP ─── */}
			<PageSection
				title="Tooltip"
				description="Short, non-interactive hints — e.g. collapsed sidebar labels, icon-only buttons."
			>
				<Tooltip>
					<TooltipTrigger render={<Button variant="outline" size="sm" />}>Hover me</TooltipTrigger>
					<TooltipContent>Additional context shown on hover/focus.</TooltipContent>
				</Tooltip>
			</PageSection>

			<Separator />

			{/* ─── POPOVER ─── */}
			<PageSection
				title="Popover"
				description="Click-triggered floating panel for small, focused content — the base for Select/Combobox/DateRangeFilter."
			>
				<Popover>
					<PopoverTrigger render={<Button variant="outline" size="sm" />}>
						Open popover
					</PopoverTrigger>
					<PopoverContent>
						<PopoverHeader>
							<PopoverTitle>Quick note</PopoverTitle>
							<PopoverDescription>
								Popovers hold small, focused content — not a full form.
							</PopoverDescription>
						</PopoverHeader>
					</PopoverContent>
				</Popover>
			</PageSection>
		</div>
	)
}

// -- Quick-add dialog body demo (useEntityForm, mimics a real quick-add form) --
function QuickAddMaterialDialogBody({ onDone }: { onDone: (result: boolean) => void }) {
	const form = useEntityForm({
		defaultValues: { code: '', name: '' },
		schema: z.object({
			code: z.string().trim().min(1, 'Code is required'),
			name: z.string().trim().min(1, 'Name is required'),
		}),
		onSubmit: async () => {
			// oxlint-disable-next-line no-promise-executor-return
			await new Promise((r) => setTimeout(r, 1500))
			onDone(true)
		},
	})

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="grid gap-4"
			>
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="MAT-XXX" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" placeholder="Material name" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={() => onDone(false)} />
			</form>
		</form.AppForm>
	)
}

// -- Unsaved Changes Dialog demo (mirrors useUnsavedChangesGuard's copy) --
function UnsavedChangesDemo() {
	const [draft, setDraft] = useState('')
	const isDirty = draft.trim().length > 0

	return (
		<div className="max-w-sm space-y-3">
			<Input
				placeholder="Type something to make this dirty..."
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
			/>
			<Button
				variant="outline"
				size="sm"
				onClick={async () => {
					if (!isDirty) {
						alert('Nothing to leave — type something first to simulate a dirty form.')
						return
					}
					const leave = await confirm({
						title: 'Unsaved changes',
						description: 'You have unsaved changes. Leave this page without saving?',
						confirmLabel: 'Leave',
						cancelLabel: 'Stay',
						variant: 'destructive',
					})
					if (leave) {
						setDraft('')
						alert('Left the page — draft discarded.')
					}
				}}
			>
				Simulate leaving the page
			</Button>
		</div>
	)
}

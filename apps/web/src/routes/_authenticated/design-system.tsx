import { createFileRoute } from '@tanstack/react-router'
import {
	BoxesIcon,
	EditIcon,
	EyeIcon,
	PackageIcon,
	ShoppingCartIcon,
	TrashIcon,
	TruckIcon,
} from 'lucide-react'

import {
	FormCombobox,
	FormDatePicker,
	FormInput,
	FormNumberField,
	FormSelect,
	FormSwitch,
	FormTextarea,
} from '@/components/form'
import {
	ActionMenu,
	ConfirmDialog,
	DataCard,
	DetailList,
	EmptyState,
	InlineAlert,
	LoadingButton,
	PageError,
	PageHeader,
	PageSection,
	PageSkeleton,
	SearchToolbar,
	StatCard,
	StatusBadge,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/design-system')({
	component: DesignSystemPage,
})

function DesignSystemPage() {
	return (
		<div className="space-y-12">
			<PageHeader
				title="Design System"
				description="Complete catalog of reusable components used across the application."
			/>

			{/* ─── STAT CARDS ─── */}
			<PageSection title="Stat Cards" description="Dashboard-style metric display.">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Total Orders"
						value="1,284"
						icon={<ShoppingCartIcon className="size-4" />}
						trend={{ value: '+12.5%', positive: true }}
					/>
					<StatCard
						title="Revenue"
						value="Rp 42.8M"
						icon={<PackageIcon className="size-4" />}
						trend={{ value: '+8.2%', positive: true }}
						description="This month"
					/>
					<StatCard
						title="Materials"
						value="156"
						icon={<BoxesIcon className="size-4" />}
					/>
					<StatCard
						title="Low Stock"
						value="7"
						icon={<TruckIcon className="size-4" />}
						trend={{ value: '+3', positive: false }}
					/>
				</div>
			</PageSection>

			<Separator />

			{/* ─── STATUS BADGES ─── */}
			<PageSection title="Status Badges" description="Variants for workflow states.">
				<div className="flex flex-wrap gap-3">
					<StatusBadge variant="default">Draft</StatusBadge>
					<StatusBadge variant="info">In Transit</StatusBadge>
					<StatusBadge variant="warning">Pending</StatusBadge>
					<StatusBadge variant="success">Completed</StatusBadge>
					<StatusBadge variant="destructive">Cancelled</StatusBadge>
					<StatusBadge variant="outline">Archived</StatusBadge>
					<StatusBadge variant="success" dot={false}>
						No Dot
					</StatusBadge>
				</div>
			</PageSection>

			<Separator />

			{/* ─── DETAIL LIST ─── */}
			<PageSection title="Detail List" description="Key-value pairs for detail pages.">
				<DetailList
					items={[
						{ label: 'Code', value: 'MAT-001' },
						{ label: 'Name', value: 'Coffee Beans (Arabica)' },
						{ label: 'Category', value: 'Raw Material' },
						{ label: 'Base UoM', value: 'kg' },
						{ label: 'Min Stock', value: '10 kg' },
						{ label: 'Status', value: <StatusBadge variant="success">Active</StatusBadge> },
					]}
					columns={3}
				/>
			</PageSection>

			<Separator />

			{/* ─── DATA CARD ─── */}
			<PageSection title="Data Card" description="Titled card section for grouped content.">
				<DataCard
					title="Material Info"
					description="Basic information about the material."
					actions={<Button variant="outline" size="sm">Edit</Button>}
				>
					<DetailList
						items={[
							{ label: 'Supplier', value: 'PT Sumber Jaya' },
							{ label: 'Last Price', value: 'Rp 85,000 / kg' },
							{ label: 'Stock', value: '24.5 kg' },
							{ label: 'Avg Cost', value: 'Rp 82,340 / kg' },
						]}
					/>
				</DataCard>
			</PageSection>

			<Separator />

			{/* ─── FORM COMPONENTS ─── */}
			<PageSection title="Form Components" description="All form field wrappers.">
				<div className="grid max-w-3xl gap-4 sm:grid-cols-2">
					<FormInput label="Material Code" placeholder="e.g. MAT-001" />
					<FormInput label="Name" placeholder="Coffee Beans" error="Name is required" />
					<FormSelect
						label="Category"
						options={[
							{ label: 'Raw Material', value: 'raw' },
							{ label: 'Packaging', value: 'packaging' },
							{ label: 'Dairy', value: 'dairy' },
						]}
						placeholder="Select category"
					/>
					<FormCombobox
						label="Supplier"
						options={[
							{ label: 'PT Sumber Jaya', value: '1' },
							{ label: 'CV Makmur Sentosa', value: '2' },
							{ label: 'UD Berkah', value: '3' },
						]}
						placeholder="Search supplier..."
					/>
					<FormNumberField label="Min Stock" value={10} min={0} step={1} />
					<FormDatePicker label="Expiry Date" placeholder="Pick a date" />
					<FormTextarea
						label="Notes"
						placeholder="Additional notes..."
						description="Optional notes about this material."
						className="sm:col-span-2"
					/>
					<FormSwitch
						label="Active"
						description="Whether this material is available for use."
						checked={true}
						className="sm:col-span-2"
					/>
				</div>
			</PageSection>

			<Separator />

			{/* ─── SEARCH TOOLBAR ─── */}
			<PageSection title="Search Toolbar" description="Search + action buttons pattern.">
				<SearchToolbar
					placeholder="Search materials..."
					actions={
						<>
							<Button variant="outline" size="sm">
								Filter
							</Button>
							<Button size="sm">Add Material</Button>
						</>
					}
				/>
			</PageSection>

			<Separator />

			{/* ─── ACTION MENU ─── */}
			<PageSection title="Action Menu" description="Row-level actions dropdown.">
				<div className="flex items-center gap-4">
					<span className="text-sm">Coffee Beans (Arabica)</span>
					<ActionMenu
						items={[
							{ label: 'View', icon: <EyeIcon />, onClick: () => {} },
							{ label: 'Edit', icon: <EditIcon />, onClick: () => {} },
							{ label: 'Delete', icon: <TrashIcon />, onClick: () => {}, variant: 'destructive' },
						]}
					/>
				</div>
			</PageSection>

			<Separator />

			{/* ─── CONFIRM DIALOG ─── */}
			<PageSection title="Confirm Dialog" description="Confirmation before destructive actions.">
				<div className="flex gap-3">
					<ConfirmDialog
						title="Delete material?"
						description="This action cannot be undone. The material will be permanently removed."
						confirmLabel="Delete"
						variant="destructive"
						onConfirm={() => {}}
					>
						<Button variant="destructive" size="sm">
							Delete (destructive)
						</Button>
					</ConfirmDialog>
					<ConfirmDialog
						title="Approve transfer?"
						description="Once approved, stock will be deducted from the source location."
						confirmLabel="Approve"
						onConfirm={() => {}}
					>
						<Button variant="outline" size="sm">
							Approve (default)
						</Button>
					</ConfirmDialog>
				</div>
			</PageSection>

			<Separator />

			{/* ─── LOADING BUTTON ─── */}
			<PageSection title="Loading Button" description="Button with loading state.">
				<div className="flex gap-3">
					<LoadingButton loading={false}>Save</LoadingButton>
					<LoadingButton loading={true}>Saving...</LoadingButton>
					<LoadingButton loading={true} variant="outline">
						Loading
					</LoadingButton>
				</div>
			</PageSection>

			<Separator />

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
			<PageSection title="Page Error" description="Route-level error display.">
				<PageError
					title="Failed to load materials"
					message="Could not connect to the server. Please check your connection."
					onRetry={() => {}}
				/>
			</PageSection>

			<Separator />

			{/* ─── PAGE SKELETON ─── */}
			<PageSection title="Page Skeleton" description="Loading state for pages.">
				<PageSkeleton />
			</PageSection>
		</div>
	)
}

import { createFileRoute } from '@tanstack/react-router'

import {
	BoxesIcon,
	EditIcon,
	EyeIcon,
	FilterIcon,
	PackageIcon,
	PlusIcon,
	ShoppingCartIcon,
	TrashIcon,
	TruckIcon,
} from 'lucide-react'

import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import {
	DataTable,
	DataTableEmpty,
	DataTableError,
	DataTableLoading,
	DataTableToolbar,
	useClientTable,
} from '@/components/data-table'
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
	confirm,
	confirmInput,
	DataCard,
	DateRangeFilter,
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
import type { ChartConfig } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/design-system')({
	component: DesignSystemPage,
})

// -- Mock data for DataTable --
interface MockMaterial {
	id: number
	code: string
	name: string
	category: string
	price: number
	stock: number
	status: string
}

const mockMaterials: MockMaterial[] = [
	{
		id: 1,
		code: 'MAT-001',
		name: 'Coffee Beans (Arabica)',
		category: 'Raw Material',
		price: 85000,
		stock: 24,
		status: 'active',
	},
	{
		id: 2,
		code: 'MAT-002',
		name: 'Whole Milk 1L',
		category: 'Dairy',
		price: 18000,
		stock: 48,
		status: 'active',
	},
	{
		id: 3,
		code: 'MAT-003',
		name: 'Sugar 1kg',
		category: 'Raw Material',
		price: 14000,
		stock: 32,
		status: 'active',
	},
	{
		id: 4,
		code: 'MAT-004',
		name: 'Paper Cup 12oz',
		category: 'Packaging',
		price: 1200,
		stock: 500,
		status: 'active',
	},
	{
		id: 5,
		code: 'MAT-005',
		name: 'Chocolate Syrup',
		category: 'Condiment',
		price: 45000,
		stock: 8,
		status: 'low',
	},
	{
		id: 6,
		code: 'MAT-006',
		name: 'Vanilla Extract',
		category: 'Condiment',
		price: 62000,
		stock: 3,
		status: 'low',
	},
	{
		id: 7,
		code: 'MAT-007',
		name: 'Oat Milk 1L',
		category: 'Dairy',
		price: 35000,
		stock: 15,
		status: 'active',
	},
	{
		id: 8,
		code: 'MAT-008',
		name: 'Matcha Powder',
		category: 'Raw Material',
		price: 120000,
		stock: 5,
		status: 'low',
	},
	{
		id: 9,
		code: 'MAT-009',
		name: 'Plastic Straw',
		category: 'Packaging',
		price: 200,
		stock: 1000,
		status: 'active',
	},
	{
		id: 10,
		code: 'MAT-010',
		name: 'Whipped Cream',
		category: 'Dairy',
		price: 28000,
		stock: 12,
		status: 'active',
	},
	{
		id: 11,
		code: 'MAT-011',
		name: 'Caramel Sauce',
		category: 'Condiment',
		price: 38000,
		stock: 9,
		status: 'active',
	},
	{
		id: 12,
		code: 'MAT-012',
		name: 'Paper Bag M',
		category: 'Packaging',
		price: 800,
		stock: 200,
		status: 'active',
	},
]

const mockColumns = [
	{ accessorKey: 'code' as const, header: 'Code' },
	{ accessorKey: 'name' as const, header: 'Name' },
	{ accessorKey: 'category' as const, header: 'Category' },
	{ accessorKey: 'price' as const, header: 'Price (IDR)' },
	{ accessorKey: 'stock' as const, header: 'Stock' },
]

// -- Mock data for Charts --
const revenueData = [
	{ month: 'Jan', revenue: 28500000, orders: 820 },
	{ month: 'Feb', revenue: 31200000, orders: 910 },
	{ month: 'Mar', revenue: 29800000, orders: 875 },
	{ month: 'Apr', revenue: 35400000, orders: 1020 },
	{ month: 'May', revenue: 38900000, orders: 1150 },
	{ month: 'Jun', revenue: 42800000, orders: 1284 },
]

const categoryData = [
	{ category: 'Coffee', sales: 4200 },
	{ category: 'Tea', sales: 2100 },
	{ category: 'Pastry', sales: 1800 },
	{ category: 'Snack', sales: 900 },
	{ category: 'Juice', sales: 1500 },
]

const stockData = [
	{ month: 'Jan', rawMaterial: 150, packaging: 400, dairy: 80 },
	{ month: 'Feb', rawMaterial: 140, packaging: 380, dairy: 75 },
	{ month: 'Mar', rawMaterial: 160, packaging: 420, dairy: 90 },
	{ month: 'Apr', rawMaterial: 135, packaging: 350, dairy: 70 },
	{ month: 'May', rawMaterial: 155, packaging: 410, dairy: 85 },
	{ month: 'Jun', rawMaterial: 145, packaging: 390, dairy: 78 },
]

const revenueChartConfig: ChartConfig = {
	revenue: { label: 'Revenue', color: 'var(--primary)' },
	orders: { label: 'Orders', color: 'var(--chart-2)' },
}

const categoryChartConfig: ChartConfig = {
	sales: { label: 'Sales', color: 'var(--primary)' },
}

const stockChartConfig: ChartConfig = {
	rawMaterial: { label: 'Raw Material', color: 'var(--primary)' },
	packaging: { label: 'Packaging', color: 'var(--chart-2)' },
	dairy: { label: 'Dairy', color: 'var(--chart-3)' },
}

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
					<StatCard title="Materials" value="156" icon={<BoxesIcon className="size-4" />} />
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
					actions={
						<Button variant="outline" size="sm">
							Edit
						</Button>
					}
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

			{/* ─── DATA TABLE WITH TOOLBAR ─── */}
			<DataTableSection />

			<Separator />

			{/* ─── CHARTS ─── */}
			<PageSection title="Charts" description="Data visualization components.">
				<div className="grid gap-6 lg:grid-cols-2">
					<DataCard title="Revenue Trend" description="Monthly revenue over time.">
						<AreaChart
							data={revenueData}
							config={revenueChartConfig}
							xAxisKey="month"
							dataKeys={['revenue']}
						/>
					</DataCard>
					<DataCard title="Orders" description="Monthly order count.">
						<LineChart
							data={revenueData}
							config={revenueChartConfig}
							xAxisKey="month"
							dataKeys={['orders']}
							showDots={true}
						/>
					</DataCard>
					<DataCard title="Sales by Category" description="Top selling categories.">
						<BarChart
							data={categoryData}
							config={categoryChartConfig}
							xAxisKey="category"
							dataKeys={['sales']}
						/>
					</DataCard>
					<DataCard title="Stock Levels" description="Stock by material type (stacked).">
						<AreaChart
							data={stockData}
							config={stockChartConfig}
							xAxisKey="month"
							dataKeys={['rawMaterial', 'packaging', 'dairy']}
							stacked={true}
							showLegend={true}
						/>
					</DataCard>
				</div>
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

			<Separator />

			{/* ─── CONFIRM (react-call) ─── */}
			<PageSection
				title="Confirm (react-call)"
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
				title="Confirm Input (react-call)"
				description="Requires typing a confirmation word before the action can proceed."
			>
				<div className="flex flex-wrap gap-3">
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							const accepted = await confirmInput({
								title: 'Delete "Coffee Beans"?',
								description:
									'This action is permanent and cannot be undone. All stock records will be removed.',
								confirmWord: 'Coffee Beans',
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
							const accepted = await confirmInput({
								title: 'Delete "Coffee Beans"?',
								description: 'This will simulate an async deletion with loading state.',
								confirmWord: 'Coffee Beans',
								confirmLabel: 'Delete permanently',
								onConfirm: async () => {
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

			{/* ─── DATE RANGE FILTER ─── */}
			<PageSection
				title="Date Range Filter"
				description="Responsive date range picker with presets (7d, 30d, etc) and custom calendar."
			>
				<DateRangeFilter
					onChange={(range) => {
						if (range)
							alert(`${range.from.toLocaleDateString()} – ${range.to.toLocaleDateString()}`)
					}}
				/>
			</PageSection>

			<Separator />

			{/* ─── DATA TABLE STATES ─── */}
			<PageSection
				title="Data Table States"
				description="Loading, error, and empty states for tables."
			>
				<div className="space-y-8">
					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">Loading State</p>
						<DataTableLoading rows={3} columns={4} />
					</div>
					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">Error State</p>
						<DataTableError
							title="Failed to load materials"
							message="Connection timed out. Please check your network."
							onRetry={() => {}}
						/>
					</div>
					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">Empty State</p>
						<DataTableEmpty
							title="No materials found"
							description="Try adjusting your search or add a new material."
							action={<Button size="sm">Add Material</Button>}
						/>
					</div>
				</div>
			</PageSection>
		</div>
	)
}

function DataTableSection() {
	const { table, globalFilter, setGlobalFilter, recordCount } = useClientTable({
		data: mockMaterials,
		columns: mockColumns,
		pageSize: 5,
	})

	return (
		<PageSection
			title="Data Table"
			description="Table with global search, client-side pagination, and toolbar."
		>
			<DataTable
				table={table}
				recordCount={recordCount}
				toolbar={
					<DataTableToolbar
						search={globalFilter}
						onSearchChange={setGlobalFilter}
						searchPlaceholder="Search materials..."
						filters={
							<Button variant="outline" size="sm">
								<FilterIcon className="mr-1.5 size-3.5" />
								Filter
							</Button>
						}
						actions={
							<Button size="sm">
								<PlusIcon className="mr-1.5 size-3.5" />
								Add Material
							</Button>
						}
					/>
				}
			/>
		</PageSection>
	)
}

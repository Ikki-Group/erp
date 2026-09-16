import { createFileRoute } from '@tanstack/react-router'
import { useTable } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useAppForm } from '@/lib/form/index.ts'

import { DataTable } from '@/components/data-table'
import { dataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState, PageError, PageHeader, PageSkeleton } from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/demo')({
	component: DemoPage,
})

// -- Mock data for the DataTable demo --
interface MockItem {
	id: number
	code: string
	name: string
	category: string
	price: number
}

const mockData: MockItem[] = [
	{
		id: 1,
		code: 'MAT-001',
		name: 'Coffee Beans (Arabica)',
		category: 'Raw Material',
		price: 85000,
	},
	{ id: 2, code: 'MAT-002', name: 'Whole Milk 1L', category: 'Dairy', price: 18000 },
	{ id: 3, code: 'MAT-003', name: 'Sugar 1kg', category: 'Raw Material', price: 14000 },
	{ id: 4, code: 'MAT-004', name: 'Paper Cup 12oz', category: 'Packaging', price: 1200 },
	{ id: 5, code: 'MAT-005', name: 'Chocolate Syrup', category: 'Condiment', price: 45000 },
]

const mockColumns = [
	{ accessorKey: 'code' as const, header: 'Code' },
	{ accessorKey: 'name' as const, header: 'Name' },
	{ accessorKey: 'category' as const, header: 'Category' },
	{ accessorKey: 'price' as const, header: 'Price (IDR)' },
]

// -- Demo page --
function DemoPage() {
	const table = useTable({
		features: dataGridFeatures,
		data: mockData,
		columns: mockColumns,
	})

	return (
		<div className="space-y-10">
			{/* PageHeader */}
			<section>
				<SectionTitle>PageHeader</SectionTitle>
				<PageHeader
					title="Materials"
					description="Manage raw materials, packaging, and supplies."
					actions={
						<Button size="sm">
							<PlusIcon className="mr-1.5 size-3.5" />
							Add Material
						</Button>
					}
				/>
			</section>

			<Separator />

			{/* Form Components */}
			<section>
				<SectionTitle>Form Components</SectionTitle>
				<DemoFormFields />
			</section>

			<Separator />

			{/* DataTable */}
			<section>
				<SectionTitle>DataTable</SectionTitle>
				<DataTable table={table} recordCount={mockData.length} />
			</section>

			<Separator />

			{/* EmptyState */}
			<section>
				<SectionTitle>EmptyState</SectionTitle>
				<EmptyState
					title="No materials yet"
					description="Add your first material to get started."
					action={
						<Button size="sm">
							<PlusIcon className="mr-1.5 size-3.5" />
							Add Material
						</Button>
					}
				/>
			</section>

			<Separator />

			{/* PageError */}
			<section>
				<SectionTitle>PageError</SectionTitle>
				<PageError
					title="Failed to load materials"
					message="Could not connect to the server. Please check your connection."
					onRetry={() => {}}
				/>
			</section>

			<Separator />

			{/* PageSkeleton */}
			<section>
				<SectionTitle>PageSkeleton</SectionTitle>
				<PageSkeleton />
			</section>
		</div>
	)
}

function SectionTitle({ children }: { children: string }) {
	return <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{children}</h2>
}

// -- Form field components demo (bound to useAppForm, no backing mutation) --
function DemoFormFields() {
	const form = useAppForm({
		defaultValues: {
			code: '',
			name: '',
			category: '',
			supplier: '',
			notes: '',
		},
	})

	return (
		<form.AppForm>
			<div className="grid max-w-2xl gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Material Code" placeholder="e.g. MAT-001" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" placeholder="Coffee Beans" />}
				</form.AppField>
				<form.AppField name="category">
					{(field) => (
						<field.SelectField
							label="Category"
							options={[
								{ label: 'Raw Material', value: 'raw' },
								{ label: 'Packaging', value: 'packaging' },
								{ label: 'Dairy', value: 'dairy' },
								{ label: 'Condiment', value: 'condiment' },
							]}
							placeholder="Select category"
						/>
					)}
				</form.AppField>
				<form.AppField name="supplier">
					{(field) => (
						<field.ComboboxField
							label="Supplier"
							options={[
								{ label: 'PT Sumber Jaya', value: '1' },
								{ label: 'CV Makmur Sentosa', value: '2' },
								{ label: 'UD Berkah', value: '3' },
							]}
							placeholder="Search supplier..."
						/>
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => (
						<field.TextareaField
							label="Notes"
							placeholder="Additional notes..."
							description="Optional notes about this material."
							wrapperClassName="sm:col-span-2"
						/>
					)}
				</form.AppField>
			</div>
		</form.AppForm>
	)
}

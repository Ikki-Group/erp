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
		category: 'Bahan Baku',
		price: 85000,
	},
	{ id: 2, code: 'MAT-002', name: 'Whole Milk 1L', category: 'Susu', price: 18000 },
	{ id: 3, code: 'MAT-003', name: 'Sugar 1kg', category: 'Bahan Baku', price: 14000 },
	{ id: 4, code: 'MAT-004', name: 'Paper Cup 12oz', category: 'Kemasan', price: 1200 },
	{ id: 5, code: 'MAT-005', name: 'Chocolate Syrup', category: 'Bumbu', price: 45000 },
]

const mockColumns = [
	{ accessorKey: 'code' as const, header: 'Kode' },
	{ accessorKey: 'name' as const, header: 'Nama' },
	{ accessorKey: 'category' as const, header: 'Kategori' },
	{ accessorKey: 'price' as const, header: 'Harga (IDR)' },
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
					title="Bahan"
					description="Kelola bahan baku, kemasan, dan perlengkapan."
					actions={
						<Button size="sm">
							<PlusIcon />
							Tambah Bahan
						</Button>
					}
				/>
			</section>

			<Separator />

			{/* Form Components */}
			<section>
				<SectionTitle>Komponen Formulir</SectionTitle>
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
					title="Belum ada bahan"
					description="Tambahkan bahan pertama Anda untuk memulai."
					action={
						<Button size="sm">
							<PlusIcon />
							Tambah Bahan
						</Button>
					}
				/>
			</section>

			<Separator />

			{/* PageError */}
			<section>
				<SectionTitle>PageError</SectionTitle>
				<PageError
					title="Gagal memuat bahan"
					message="Tidak dapat terhubung ke server. Periksa koneksi Anda."
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
	return (
		<h2 className="mb-4 text-sm font-semibold tracking-tight text-muted-foreground">{children}</h2>
	)
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
					{(field) => <field.TextField label="Kode Bahan" placeholder="mis. MAT-001" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Nama" placeholder="Biji Kopi" />}
				</form.AppField>
				<form.AppField name="category">
					{(field) => (
						<field.SelectField
							label="Kategori"
							options={[
								{ label: 'Bahan Baku', value: 'raw' },
								{ label: 'Kemasan', value: 'packaging' },
								{ label: 'Susu', value: 'dairy' },
								{ label: 'Bumbu', value: 'condiment' },
							]}
							placeholder="Pilih kategori"
						/>
					)}
				</form.AppField>
				<form.AppField name="supplier">
					{(field) => (
						<field.ComboboxField
							label="Pemasok"
							options={[
								{ label: 'PT Sumber Jaya', value: '1' },
								{ label: 'CV Makmur Sentosa', value: '2' },
								{ label: 'UD Berkah', value: '3' },
							]}
							placeholder="Cari pemasok..."
						/>
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => (
						<field.TextareaField
							label="Catatan"
							placeholder="Catatan tambahan..."
							description="Catatan opsional tentang bahan ini."
							wrapperClassName="sm:col-span-2"
						/>
					)}
				</form.AppField>
			</div>
		</form.AppForm>
	)
}

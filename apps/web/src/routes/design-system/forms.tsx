import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { useAppForm } from '@/lib/form/index.ts'

import {
	AsyncCombobox,
	CrudForm,
	CurrencyInput,
	DateRangeFilter,
	FileUpload,
	PageHeader,
	PageSection,
} from '@/components/shared'
import type { AsyncComboboxOption, FileUploadItem } from '@/components/shared'

import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/design-system/forms')({
	component: FormsPage,
})

function FormsPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Forms & Inputs"
				description="Field components bound to the form engine, raw input primitives, and standalone pickers."
			/>

			{/* ─── FORM COMPONENTS ─── */}
			<PageSection
				title="Form Components"
				description="Field components bound to the useAppForm/useEntityForm engine — see @/lib/form. Each wraps a raw primitive (below) with label, description, and error display via Field."
			>
				<FormFieldsDemo />
			</PageSection>

			<Separator />

			{/* ─── CHECKBOX, RADIO & SWITCH ─── */}
			<PageSection
				title="Checkbox, Radio & Switch"
				description="Raw primitives — Form Components above wraps these with label/description/error via Field. Reach for these directly only outside a form (e.g. a toolbar toggle)."
			>
				<div className="grid gap-8 sm:grid-cols-3">
					<div className="space-y-3">
						<p className="text-xs font-medium text-muted-foreground">Checkbox</p>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox defaultChecked />
							Checked
						</label>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox />
							Unchecked
						</label>
						<label className="flex items-center gap-2 text-sm text-muted-foreground">
							<Checkbox disabled />
							Disabled
						</label>
					</div>

					<div className="space-y-3">
						<p className="text-xs font-medium text-muted-foreground">Radio Group</p>
						<RadioGroup defaultValue="store">
							<label className="flex items-center gap-2 text-sm">
								<RadioGroupItem value="store" />
								Store
							</label>
							<label className="flex items-center gap-2 text-sm">
								<RadioGroupItem value="warehouse" />
								Warehouse
							</label>
						</RadioGroup>
					</div>

					<div className="space-y-3">
						<p className="text-xs font-medium text-muted-foreground">Switch</p>
						<label className="flex items-center gap-2 text-sm">
							<Switch defaultChecked />
							Active
						</label>
						<label className="flex items-center gap-2 text-sm">
							<Switch />
							Inactive
						</label>
						<label className="flex items-center gap-2 text-sm text-muted-foreground">
							<Switch disabled />
							Disabled
						</label>
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── CURRENCY INPUT ─── */}
			<PageSection
				title="Currency Input"
				description="Standalone Rupiah amount input for money state outside the form engine (e.g. POS payment entry). Use field.CurrencyField instead inside a useEntityForm."
			>
				<CurrencyInputDemo />
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

			{/* ─── ASYNC COMBOBOX ─── */}
			<PageSection
				title="Async Combobox"
				description="Single-select combobox backed by a remote search — the query is debounced internally; the caller owns the fetch and hands back options/isLoading. Reach for the plain Combobox field above when the whole option list already fits in memory."
			>
				<AsyncComboboxDemo />
			</PageSection>

			<Separator />

			{/* ─── FILE UPLOAD ─── */}
			<PageSection
				title="File Upload"
				description="Drag-and-drop + click-to-browse dropzone, with picked files listed below as Attachment rows (uploading/error/done). Presentation only — the caller owns the actual upload request."
			>
				<FileUploadDemo />
			</PageSection>

			<Separator />

			{/* ─── CRUD FORM ─── */}
			<PageSection
				title="Crud Form"
				description="CrudForm is a semantic alias for FormPage — the standard full-page create/edit layout: back button, title, body, and a sticky footer with cancel/submit. Boxed and scrollable here only so the sticky footer stays within this demo instead of the whole catalog page."
			>
				<CrudFormDemo />
			</PageSection>
		</div>
	)
}

// -- Form field components demo (bound to useAppForm, no backing mutation) --
function FormFieldsDemo() {
	const form = useAppForm({
		defaultValues: {
			code: '',
			name: '',
			category: '',
			supplier: '',
			minStock: 10 as number | null,
			expiryDate: undefined as Date | undefined,
			notes: '',
			active: true,
		},
	})

	return (
		<form.AppForm>
			<div className="grid max-w-3xl gap-4 sm:grid-cols-2">
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
				<form.AppField name="minStock">
					{(field) => <field.NumberField label="Min Stock" min={0} step={1} />}
				</form.AppField>
				<form.AppField name="expiryDate">
					{(field) => <field.DatePickerField label="Expiry Date" placeholder="Pick a date" />}
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
				<form.AppField name="active">
					{(field) => (
						<field.SwitchField
							label="Active"
							description="Whether this material is available for use."
							className="sm:col-span-2"
						/>
					)}
				</form.AppField>
			</div>
		</form.AppForm>
	)
}

// -- Async Combobox demo (simulated remote search with latency) --
const MOCK_SUPPLIERS: AsyncComboboxOption[] = [
	{ label: 'PT Sumber Jaya', value: '1' },
	{ label: 'CV Makmur Sentosa', value: '2' },
	{ label: 'UD Berkah Abadi', value: '3' },
	{ label: 'PT Nusantara Pangan', value: '4' },
	{ label: 'CV Tani Organik', value: '5' },
	{ label: 'UD Sari Alam', value: '6' },
	{ label: 'PT Kopi Nusantara', value: '7' },
	{ label: 'CV Roti Bahagia', value: '8' },
]

function AsyncComboboxDemo() {
	const [value, setValue] = useState<AsyncComboboxOption | null>(null)
	const [options, setOptions] = useState<AsyncComboboxOption[]>([])
	const [isLoading, setIsLoading] = useState(false)

	return (
		<div className="max-w-sm space-y-2">
			<AsyncCombobox
				value={value}
				onValueChange={setValue}
				options={options}
				isLoading={isLoading}
				placeholder="Search supplier..."
				onSearchChange={(query) => {
					setIsLoading(true)
					// Simulates network latency — a real integration wires this to
					// `useQuery({ queryKey: ['suppliers', query], ... })`. An empty query
					// still resolves (to the full list) instead of clearing — so opening
					// the combobox shows results immediately, before the user types.
					window.setTimeout(() => {
						const filtered = query
							? MOCK_SUPPLIERS.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
							: MOCK_SUPPLIERS
						setOptions(filtered)
						setIsLoading(false)
					}, 500)
				}}
			/>
			<p className="text-xs text-muted-foreground">
				{value ? `Selected: ${value.label}` : '8 suppliers available server-side — type to filter.'}
			</p>
		</div>
	)
}

// -- Currency Input demo (standalone, outside the form engine) --
function CurrencyInputDemo() {
	const [value, setValue] = useState<number | undefined>(85000)

	return (
		<div className="max-w-xs space-y-2">
			<CurrencyInput value={value} onValueChange={setValue} aria-label="Price" />
			<p className="text-xs text-muted-foreground">Value: {value ?? 0}</p>
		</div>
	)
}

// -- File Upload demo (simulated upload progress) --
function FileUploadDemo() {
	const [items, setItems] = useState<FileUploadItem[]>([])

	const simulateUpload = (files: File[]) => {
		for (const file of files) {
			const id = `${file.name}-${Date.now()}-${Math.random()}`
			setItems((prev) => [...prev, { id, name: file.name, size: file.size, progress: 0 }])

			const interval = window.setInterval(() => {
				setItems((prev) =>
					prev.map((item) => {
						if (item.id !== id || item.progress === undefined) return item
						const next = Math.min(item.progress + 20, 100)
						return { ...item, progress: next === 100 ? undefined : next }
					}),
				)
			}, 300)

			window.setTimeout(() => window.clearInterval(interval), 2000)
		}
	}

	return (
		<div className="max-w-md">
			<FileUpload
				items={items}
				onFilesSelected={simulateUpload}
				onRemove={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
				accept="image/*,.pdf"
				description="PDF, PNG, JPG up to 10MB"
			/>
		</div>
	)
}

// -- Crud Form demo (FormPage via its CrudForm alias) --
function CrudFormDemo() {
	const form = useAppForm({
		defaultValues: { code: '', name: '', category: '' },
	})

	return (
		<div className="max-h-[420px] overflow-y-auto rounded-lg border">
			<form.AppForm>
				<CrudForm
					className="p-6"
					title="Add Material"
					description="Create a new material in your inventory."
					form={form}
					onCancel={() => alert('Would navigate back to the material list.')}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.AppField name="code">
							{(field) => <field.TextField label="Code" placeholder="MAT-XXX" />}
						</form.AppField>
						<form.AppField name="name">
							{(field) => <field.TextField label="Name" placeholder="Material name" />}
						</form.AppField>
						<form.AppField name="category">
							{(field) => (
								<field.SelectField
									label="Category"
									options={[
										{ label: 'Raw Material', value: 'raw' },
										{ label: 'Packaging', value: 'packaging' },
									]}
									placeholder="Select category"
								/>
							)}
						</form.AppField>
					</div>
				</CrudForm>
			</form.AppForm>
		</div>
	)
}

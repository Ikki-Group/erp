import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { z } from 'zod'

import {
	NumberInputGroupAddonField,
	NumberInputGroupField,
} from '@/lib/form/fields/number-input-group-field'
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
				description="Use field adapters inside useAppForm/useEntityForm for labels, hints, and validation. Choose a select for short lists, a combobox for searchable lists, and a fixed unit unless staff need to change it."
			>
				<FormFieldsDemo />
			</PageSection>

			<Separator />

			{/* ─── CHECKBOX, RADIO & SWITCH ─── */}
			<PageSection
				title="Checkbox, Radio & Switch"
				description="Use checkboxes for independent choices, radios for one choice from a visible set, and switches for on/off settings. The SwitchField adapter adds a label, hint, and validation inside a form."
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
						<RadioGroup defaultValue="store" aria-label="Location type">
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
				description="Use the standalone Rupiah input outside the form engine. Inside useAppForm/useEntityForm, use field.CurrencyField to keep validation and accessible labels together."
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
				title="Validation & Form Layout"
				description="Submit the empty form to see recoverable errors, then enter a code, name, and category. This client-only example displays validated values below; it does not save a material. The sticky footer stays within the demo."
			>
				<CrudFormDemo />
			</PageSection>
		</div>
	)
}

const UOM_OPTIONS = [
	{ id: 1, code: 'kg' },
	{ id: 2, code: 'g' },
	{ id: 3, code: 'L' },
	{ id: 4, code: 'mL' },
	{ id: 5, code: 'pcs' },
]

// -- Form field components demo (bound to useAppForm, no backing mutation) --
function FormFieldsDemo() {
	const form = useAppForm({
		defaultValues: {
			code: 'MAT-001',
			name: '',
			category: '',
			supplier: '',
			minStock: 10 as number | null,
			quantity: null as number | null,
			quantityEditable: null as number | null,
			uomIdEditable: null as number | null,
			expiryDate: undefined as Date | undefined,
			notes: '',
			price: '',
			emptySupplier: '',
			active: true,
		},
	})

	return (
		<form.AppForm>
			<div className="grid max-w-3xl gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => (
						<field.TextField
							label="Material Code"
							disabled
							description="Disabled: a reference value that cannot be edited here."
						/>
					)}
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
				{/* Static UOM input group demo */}
				<form.AppField name="quantity">
					{() => (
						<NumberInputGroupAddonField
							label="Quantity (Static UOM)"
							uomLabel="kg"
							description="Fixed unit - weight in kilograms."
						/>
					)}
				</form.AppField>
				{/* Editable UOM input group demo */}
				<form.AppField name="quantityEditable">
					{(quantityField) => (
						<form.AppField name="uomIdEditable">
							{(uomField) => (
								<NumberInputGroupField
									label="Quantity (Editable UOM)"
									quantityField={quantityField}
									uomField={uomField}
									uomOptions={UOM_OPTIONS}
									step="any"
									description="Enter 12.5, then switch between kg and g. Changing the unit does not convert the quantity."
								/>
							)}
						</form.AppField>
					)}
				</form.AppField>
				<form.Subscribe
					selector={(state) => [state.values.quantityEditable, state.values.uomIdEditable] as const}
				>
					{([quantity, uomId]) => (
						<dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted/40 p-3 text-xs sm:col-span-2">
							<div>
								<dt className="text-muted-foreground">Entered quantity</dt>
								<dd className="font-mono tabular-nums">{quantity ?? 'Not entered'}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Chosen unit</dt>
								<dd className="font-mono">
									{UOM_OPTIONS.find((uom) => uom.id === uomId)?.code ?? 'Not selected'}
								</dd>
							</div>
						</dl>
					)}
				</form.Subscribe>
				<form.AppField name="price">
					{(field) => (
						<field.CurrencyField
							label="Price"
							description="Use for monetary amounts, not stock quantities."
						/>
					)}
				</form.AppField>
				<form.AppField name="emptySupplier">
					{(field) => (
						<field.ComboboxField
							label="Supplier (Empty State)"
							options={[]}
							placeholder="Search supplier..."
							emptyMessage="No suppliers available. Add a supplier before selecting one."
							description="Open to see the empty list and recovery guidance."
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
				{value
					? `Selected: ${value.label}`
					: '8 local example suppliers — search simulates a network delay.'}
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

const materialDemoSchema = z.object({
	code: z.string().trim().min(1, 'Enter a material code, for example MAT-001.'),
	name: z.string().trim().min(1, 'Enter a material name, for example Coffee Beans.'),
	category: z
		.string()
		.refine((value) => value === 'raw' || value === 'packaging', 'Choose a category.'),
})

// -- Crud Form demo (FormPage via its CrudForm alias) --
function CrudFormDemo() {
	const [submittedValues, setSubmittedValues] = useState<{
		code: string
		name: string
		category: string
	} | null>(null)
	const form = useAppForm({
		defaultValues: { code: '', name: '', category: '' },
		validators: { onChange: materialDemoSchema, onSubmit: materialDemoSchema },
		onSubmit: ({ value }) => setSubmittedValues({ ...value }),
	})

	return (
		<div className="max-h-105 overflow-y-auto rounded-lg border">
			<form.AppForm>
				<CrudForm
					className="p-6"
					title="Validate Material Details"
					description="Required fields: code, name, and category. No backend request is made."
					form={form}
					submitLabel="Validate details"
					cancelLabel="Reset example"
					onCancel={() => {
						form.reset()
						setSubmittedValues(null)
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.AppField name="code">
							{(field) => (
								<field.TextField
									label="Code"
									placeholder="MAT-001"
									description="Required. Use the material's reference code."
								/>
							)}
						</form.AppField>
						<form.AppField name="name">
							{(field) => (
								<field.TextField
									label="Name"
									placeholder="Coffee Beans"
									description="Required. Enter the material's display name."
								/>
							)}
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
									description="Required. Choose the material category."
								/>
							)}
						</form.AppField>
					</div>
					<div aria-live="polite" className="mt-4 rounded-md bg-muted/40 p-3 text-sm">
						{submittedValues ? (
							<>
								<p className="font-medium">Last validated values — local only, not saved</p>
								<dl className="mt-2 space-y-1 text-xs">
									<div className="flex gap-2">
										<dt>Code:</dt>
										<dd className="break-all font-mono">{submittedValues.code}</dd>
									</div>
									<div className="flex gap-2">
										<dt>Name:</dt>
										<dd className="min-w-0 break-words">{submittedValues.name}</dd>
									</div>
									<div className="flex gap-2">
										<dt>Category:</dt>
										<dd>{submittedValues.category === 'raw' ? 'Raw Material' : 'Packaging'}</dd>
									</div>
								</dl>
							</>
						) : (
							<p className="text-muted-foreground">
								No values submitted yet. Validate details to display them here.
							</p>
						)}
					</div>
				</CrudForm>
			</form.AppForm>
		</div>
	)
}

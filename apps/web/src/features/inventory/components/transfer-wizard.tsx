import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'

import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import {
	createLineItem,
	LineItemEditor,
	type LineItem,
} from '@/components/shared/line-item-editor.tsx'

import { locationResource } from '@/features/location/api.ts'
import { LocationLookupField } from '@/features/location/components/location-lookup-field.tsx'
import { MaterialLookupField } from '@/features/material/components/material-lookup-field.tsx'
import { UomLookupField } from '@/features/uom/components/uom-lookup-field.tsx'

import { InventoryLineMaterial, InventoryLineUom } from './inventory-line-labels.tsx'

// ─── Values / Schema ───

export interface TransferLineValues extends LineItem {
	materialId: number | null
	qty: string
	uomId: number | null
}

export interface TransferWizardValues {
	fromLocationId: number | null
	toLocationId: number | null
	notes: string
	lines: TransferLineValues[]
}

const TransferLineSchema = z.object({
	materialId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Material wajib dipilih' }),
	qty: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Jumlah harus angka positif'),
	uomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Satuan wajib dipilih' }),
})

export const TransferWizardSchema = z
	.object({
		fromLocationId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Lokasi asal wajib dipilih' }),
		toLocationId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Lokasi tujuan wajib dipilih' }),
		notes: z.string().trim().default(''),
		lines: z.array(TransferLineSchema).min(1, 'Tambahkan minimal satu item'),
	})
	.refine((v) => v.fromLocationId === null || v.fromLocationId !== v.toLocationId, {
		error: 'Lokasi tujuan harus berbeda dari lokasi asal',
		path: ['toLocationId'],
	})

export function makeTransferLineValues(): TransferLineValues {
	return createLineItem({ materialId: null, qty: '', uomId: null })
}

export function makeEmptyTransferWizardValues(fromLocationId?: number): TransferWizardValues {
	return {
		fromLocationId: fromLocationId ?? null,
		toLocationId: null,
		notes: '',
		lines: [],
	}
}

export interface UseTransferWizardOptions {
	defaultValues: TransferWizardValues
	onSubmit: (values: TransferWizardValues) => Promise<void>
}

export function useTransferWizard({ defaultValues, onSubmit }: UseTransferWizardOptions) {
	return useEntityForm({
		defaultValues,
		schema: TransferWizardSchema,
		onSubmit,
	})
}

export type TransferWizardForm = ReturnType<typeof useTransferWizard>

/** Cheap client-side gate for "can the user move past this step" — the Zod schema still runs at submit. */
export function isTransferStepValid(step: number, values: TransferWizardValues): boolean {
	if (step === 1) {
		return (
			values.fromLocationId !== null &&
			values.toLocationId !== null &&
			values.fromLocationId !== values.toLocationId
		)
	}
	if (step === 2) {
		return (
			values.lines.length > 0 &&
			values.lines.every(
				(l) => l.materialId !== null && l.uomId !== null && /^\d+(\.\d+)?$/u.test(l.qty),
			)
		)
	}
	return true
}

// ─── Step 1: Locations & Notes ───

export function TransferStepLocations({
	form,
	fromLocationLocked,
}: {
	form: TransferWizardForm
	fromLocationLocked?: boolean
}) {
	return (
		<div className="grid gap-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="fromLocationId">
					{() => (
						<LocationLookupField
							label="Lokasi Asal"
							placeholder="Pilih lokasi asal"
							disabled={fromLocationLocked}
						/>
					)}
				</form.AppField>
				<form.AppField name="toLocationId">
					{() => <LocationLookupField label="Lokasi Tujuan" placeholder="Pilih lokasi tujuan" />}
				</form.AppField>
			</div>
			<form.AppField name="notes">
				{(field) => <field.TextField label="Catatan" placeholder="Opsional" />}
			</form.AppField>
		</div>
	)
}

// ─── Step 2: Lines ───

export function TransferStepLines({ form }: { form: TransferWizardForm }) {
	return (
		<form.AppField name="lines" mode="array">
			{(linesField) => (
				<LineItemEditor
					label="Item Transfer"
					rows={linesField.state.value}
					createRow={makeTransferLineValues}
					onAdd={(row) => linesField.pushValue(row)}
					onRemove={(index) => linesField.removeValue(index)}
					errors={linesField.state.meta.errors}
					fieldCount={3}
					emptyMessage="Belum ada item. Tambah baris untuk memindahkan bahan."
					renderFields={(_, index) => (
						<>
							<form.AppField name={`lines[${index}].materialId`}>
								{() => (
									<MaterialLookupField
										label="Material"
										placeholder="Pilih material"
										onSelect={(material) => {
											if (material?.baseUomId)
												form.setFieldValue(`lines[${index}].uomId`, material.baseUomId)
										}}
									/>
								)}
							</form.AppField>
							<form.AppField name={`lines[${index}].qty`}>
								{(field) => (
									<field.TextField
										label="Jumlah"
										placeholder="0"
										inputMode="decimal"
										className="text-right font-mono tabular-nums"
									/>
								)}
							</form.AppField>
							<form.AppField name={`lines[${index}].uomId`}>
								{() => <UomLookupField label="Satuan" placeholder="UoM" />}
							</form.AppField>
						</>
					)}
				/>
			)}
		</form.AppField>
	)
}

// ─── Step 3: Review ───

export function TransferStepReview({ form }: { form: TransferWizardForm }) {
	const values = useStore(form.store, (state) => state.values)
	const fromLocationQuery = useQuery({
		...locationResource.detail.queryOptions({ id: values.fromLocationId! }),
		enabled: values.fromLocationId !== null,
		throwOnError: false,
	})
	const toLocationQuery = useQuery({
		...locationResource.detail.queryOptions({ id: values.toLocationId! }),
		enabled: values.toLocationId !== null,
		throwOnError: false,
	})
	const fromLocation = fromLocationQuery.data?.data
	const toLocation = toLocationQuery.data?.data

	return (
		<div className="space-y-4">
			<div className="rounded-md border p-4">
				<dl className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt className="text-muted-foreground">Dari</dt>
						<dd className="font-medium">
							{fromLocation
								? `${fromLocation.name} (${fromLocation.code})`
								: values.fromLocationId !== null
									? `#${values.fromLocationId}`
									: '—'}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Ke</dt>
						<dd className="font-medium">
							{toLocation
								? `${toLocation.name} (${toLocation.code})`
								: values.toLocationId !== null
									? `#${values.toLocationId}`
									: '—'}
						</dd>
					</div>
					<div className="col-span-2">
						<dt className="text-muted-foreground">Catatan</dt>
						<dd className="font-medium">{values.notes || '—'}</dd>
					</div>
				</dl>
			</div>

			<div className="overflow-x-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr>
							<th className="px-3 py-2 text-left font-medium">Material</th>
							<th className="px-3 py-2 text-right font-medium">Jumlah</th>
							<th className="px-3 py-2 text-left font-medium">Satuan</th>
						</tr>
					</thead>
					<tbody>
						{values.lines.map((line) => (
							<tr key={line.clientKey} className="border-t">
								<td className="px-3 py-2">
									<InventoryLineMaterial id={line.materialId} />
								</td>
								<td className="px-3 py-2 text-right font-mono tabular-nums">{line.qty}</td>
								<td className="px-3 py-2">
									<InventoryLineUom id={line.uomId} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<form.FormError />
		</div>
	)
}

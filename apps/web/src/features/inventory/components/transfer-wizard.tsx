import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import { useEntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { locationResource } from '@/features/location/api.ts'
import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

// ─── Values / Schema ───

export interface TransferLineValues {
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

export const EMPTY_TRANSFER_LINE: TransferLineValues = {
	materialId: null,
	qty: '',
	uomId: null,
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
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const locationOptions = (locationsQuery.data?.data ?? []).map((l) => ({
		label: `${l.name} (${l.code})`,
		value: l.id,
	}))

	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="fromLocationId">
					{(field) => (
						<field.IdSelectField
							label="Lokasi Asal"
							options={locationOptions}
							placeholder="Pilih lokasi asal"
							disabled={fromLocationLocked}
						/>
					)}
				</form.AppField>
				<form.AppField name="toLocationId">
					{(field) => (
						<field.IdSelectField
							label="Lokasi Tujuan"
							options={locationOptions}
							placeholder="Pilih lokasi tujuan"
						/>
					)}
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
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))
	const materialOptions = (materialsQuery.data?.data ?? []).map((m) => ({
		label: `${m.name} (${m.code})`,
		value: m.id,
	}))
	const uomOptions = (uomsQuery.data?.data ?? []).map((u) => ({
		label: `${u.name} (${u.code})`,
		value: u.id,
	}))

	const materialUomMap = new Map(
		(materialsQuery.data?.data ?? []).map((m) => [m.id, m.baseUomId] as const),
	)

	return (
		<form.AppField name="lines" mode="array">
			{(linesField) => (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label>Item Transfer</Label>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => linesField.pushValue({ ...EMPTY_TRANSFER_LINE })}
						>
							<PlusIcon className="size-3.5" />
							Tambah Baris
						</Button>
					</div>

					{linesField.state.value.length === 0 && (
						<p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
							Belum ada item. Tambah baris untuk memindahkan bahan.
						</p>
					)}

					<div className="space-y-2">
						{linesField.state.value.map((_, i) => (
							<div key={i} className="flex items-start gap-2 rounded-md border p-3">
								<div className="flex-1">
									<form.AppField name={`lines[${i}].materialId`}>
										{(field) => (
											<field.IdSelectField
												label={i === 0 ? 'Material' : '\u00A0'}
												options={materialOptions}
												placeholder="Pilih material"
												onValueChange={(v) => {
													field.handleChange(v)
													if (v !== null) {
														const defaultUom = materialUomMap.get(v)
														if (defaultUom) {
															form.setFieldValue(`lines[${i}].uomId`, defaultUom)
														}
													}
												}}
											/>
										)}
									</form.AppField>
								</div>
								<div className="w-28">
									<form.AppField name={`lines[${i}].qty`}>
										{(field) => (
											<field.TextField label={i === 0 ? 'Jumlah' : '\u00A0'} placeholder="0" />
										)}
									</form.AppField>
								</div>
								<div className="w-32">
									<form.AppField name={`lines[${i}].uomId`}>
										{(field) => (
											<field.IdSelectField
												label={i === 0 ? 'Satuan' : '\u00A0'}
												options={uomOptions}
												placeholder="UoM"
											/>
										)}
									</form.AppField>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className={i === 0 ? 'mt-6' : ''}
									onClick={() => linesField.removeValue(i)}
								>
									<Trash2Icon className="size-4" />
								</Button>
							</div>
						))}
					</div>
				</div>
			)}
		</form.AppField>
	)
}

// ─── Step 3: Review ───

export function TransferStepReview({ form }: { form: TransferWizardForm }) {
	const values = form.store.state.values

	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const getLocation = (id: number | null) =>
		(locationsQuery.data?.data ?? []).find((l) => l.id === id)
	const getMaterial = (id: number | null) =>
		(materialsQuery.data?.data ?? []).find((m) => m.id === id)
	const getUom = (id: number | null) => (uomsQuery.data?.data ?? []).find((u) => u.id === id)

	const fromLocation = getLocation(values.fromLocationId)
	const toLocation = getLocation(values.toLocationId)

	return (
		<div className="space-y-4">
			<div className="rounded-md border p-4">
				<dl className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt className="text-muted-foreground">Dari</dt>
						<dd className="font-medium">
							{fromLocation ? `${fromLocation.name} (${fromLocation.code})` : '—'}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Ke</dt>
						<dd className="font-medium">
							{toLocation ? `${toLocation.name} (${toLocation.code})` : '—'}
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
						{values.lines.map((line, i) => {
							const material = getMaterial(line.materialId)
							const uom = getUom(line.uomId)
							return (
								<tr key={i} className="border-t">
									<td className="px-3 py-2">
										{material ? `${material.name} (${material.code})` : `#${line.materialId}`}
									</td>
									<td className="px-3 py-2 text-right">{line.qty}</td>
									<td className="px-3 py-2">{uom?.code ?? `#${line.uomId}`}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			<form.FormError />
		</div>
	)
}

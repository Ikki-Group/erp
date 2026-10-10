import { useQuery } from '@tanstack/react-query'

import { MapPinIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { CurrencyDisplay } from '@/components/shared/currency-display.tsx'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { materialResource } from '@/features/material/api.ts'
import { pricingResource, supplierResource } from '@/features/supplier/api.ts'
import { uomResource } from '@/features/uom/api.ts'

// ─── Values / Schema ───

export interface ReceivingLineValues {
	materialId: number | null
	qty: string
	unitCost: string
	uomId: number | null
}

export interface ReceivingWizardValues {
	supplierId: number | null
	notes: string
	lines: ReceivingLineValues[]
}

const decimal = (message: string) =>
	z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, message)

const ReceivingLineSchema = z.object({
	materialId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Material wajib dipilih' }),
	qty: decimal('Jumlah harus angka positif'),
	unitCost: decimal('Harga satuan harus angka positif atau nol'),
	uomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Satuan wajib dipilih' }),
})

export const ReceivingWizardSchema = z.object({
	supplierId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Supplier wajib dipilih' }),
	notes: z.string().trim().default(''),
	lines: z.array(ReceivingLineSchema).min(1, 'Tambahkan minimal satu item'),
})

export const EMPTY_RECEIVING_LINE: ReceivingLineValues = {
	materialId: null,
	qty: '',
	unitCost: '',
	uomId: null,
}

export const EMPTY_RECEIVING_WIZARD_VALUES: ReceivingWizardValues = {
	supplierId: null,
	notes: '',
	lines: [],
}

export interface UseReceivingWizardOptions {
	onSubmit: (values: ReceivingWizardValues) => Promise<void>
}

export function useReceivingWizard({ onSubmit }: UseReceivingWizardOptions) {
	return useEntityForm({
		defaultValues: EMPTY_RECEIVING_WIZARD_VALUES,
		schema: ReceivingWizardSchema,
		onSubmit,
	})
}

export type ReceivingWizardForm = ReturnType<typeof useReceivingWizard>

/** Cheap client-side gate for "can the user move past this step" — the Zod schema still runs at submit. */
export function isReceivingStepValid(step: number, values: ReceivingWizardValues): boolean {
	if (step === 1) return values.supplierId !== null
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

// ─── Destination ───

export interface ReceivingDestination {
	name: string
	code: string
}

/** Where the goods land: always the active location (switch it in the header to change). */
function DestinationCallout({ destination }: { destination: ReceivingDestination }) {
	return (
		<div className="flex items-start gap-3 rounded-lg border bg-card p-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
				<MapPinIcon className="size-4" />
			</div>
			<div className="min-w-0 space-y-0.5">
				<p className="text-xs text-muted-foreground">Barang masuk ke</p>
				<p className="text-sm font-medium">
					{destination.name}{' '}
					<span className="font-mono text-xs text-muted-foreground">{destination.code}</span>
				</p>
				<p className="text-xs text-muted-foreground">
					Lokasi aktif. Ganti lokasi di pemilih lokasi bila tujuan berbeda.
				</p>
			</div>
		</div>
	)
}

// ─── Step 1: Supplier & Notes ───

export function ReceivingStepSupplier({
	form,
	destination,
}: {
	form: ReceivingWizardForm
	destination: ReceivingDestination
}) {
	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
	const supplierOptions = (suppliersQuery.data?.data ?? [])
		.filter((s) => s.isActive)
		.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))

	return (
		<div className="grid gap-4">
			<DestinationCallout destination={destination} />
			<form.AppField name="supplierId">
				{(field) => (
					<field.IdSelectField
						label="Supplier"
						options={supplierOptions}
						placeholder="Pilih supplier"
					/>
				)}
			</form.AppField>
			<form.AppField name="notes">
				{(field) => <field.TextField label="Catatan" placeholder="Opsional" />}
			</form.AppField>
		</div>
	)
}

// ─── Step 2: Lines ───

export function ReceivingStepLines({ form }: { form: ReceivingWizardForm }) {
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

	const supplierId = form.store.state.values.supplierId

	const pricingQuery = useQuery({
		...pricingResource.list.queryOptions({
			supplierId: supplierId ?? undefined,
			page: 1,
			limit: 200,
		}),
		enabled: !!supplierId,
	})

	return (
		<form.AppField name="lines" mode="array">
			{(linesField) => (
				<div className="space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Label>Item Penerimaan</Label>
						<div className="flex flex-wrap gap-2">
							{supplierId && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={pricingQuery.isLoading || !pricingQuery.data?.data.length}
									onClick={() => {
										for (const sm of pricingQuery.data?.data ?? []) {
											linesField.pushValue({
												materialId: sm.materialId,
												qty: '',
												unitCost: sm.unitPrice,
												uomId: sm.uomId,
											})
										}
									}}
								>
									Muat dari katalog supplier
								</Button>
							)}
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => linesField.pushValue({ ...EMPTY_RECEIVING_LINE })}
							>
								<PlusIcon className="size-3.5" />
								Tambah Baris
							</Button>
						</div>
					</div>

					{linesField.state.value.length === 0 && (
						<p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
							Belum ada item. Tambah baris manual atau muat dari katalog supplier.
						</p>
					)}

					<div className="space-y-2">
						{linesField.state.value.map((_, i) => {
							// Labels stay in the accessibility tree; on desktop only the first row shows them.
							const label = i === 0 ? '' : 'md:[&>label]:sr-only'
							return (
								<div
									key={i}
									className="grid grid-cols-2 items-start gap-2 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_6rem_8rem_9rem_auto] max-md:[&_[data-slot=input-group]]:h-10 max-md:[&_[data-slot=select-trigger]]:h-10 max-md:[&_input]:h-10 max-md:[&_input]:text-base"
								>
									<div className="col-span-2 md:col-span-1">
										<form.AppField name={`lines[${i}].materialId`}>
											{(field) => (
												<field.IdSelectField
													label="Material"
													options={materialOptions}
													placeholder="Pilih material"
													className={label}
												/>
											)}
										</form.AppField>
									</div>
									<form.AppField name={`lines[${i}].qty`}>
										{(field) => (
											<field.TextField
												label="Jumlah"
												placeholder="0"
												inputMode="decimal"
												wrapperClassName={label}
												className="text-right font-mono tabular-nums"
											/>
										)}
									</form.AppField>
									<form.AppField name={`lines[${i}].uomId`}>
										{(field) => (
											<field.IdSelectField
												label="Satuan"
												options={uomOptions}
												placeholder="UoM"
												className={label}
											/>
										)}
									</form.AppField>
									<form.AppField name={`lines[${i}].unitCost`}>
										{(field) => <field.CurrencyField label="Harga satuan" className={label} />}
									</form.AppField>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Hapus baris ${i + 1}`}
										className="self-end justify-self-end max-md:size-10"
										onClick={() => linesField.removeValue(i)}
									>
										<Trash2Icon className="size-4" />
									</Button>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</form.AppField>
	)
}

// ─── Step 3: Review ───

export function ReceivingStepReview({
	form,
	destination,
}: {
	form: ReceivingWizardForm
	destination: ReceivingDestination
}) {
	const values = form.store.state.values

	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const supplier = (suppliersQuery.data?.data ?? []).find((s) => s.id === values.supplierId)
	const getMaterial = (id: number | null) =>
		(materialsQuery.data?.data ?? []).find((m) => m.id === id)
	const getUom = (id: number | null) => (uomsQuery.data?.data ?? []).find((u) => u.id === id)

	return (
		<div className="space-y-4">
			<div className="rounded-md border p-4">
				<dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
					<div>
						<dt className="text-muted-foreground">Lokasi tujuan</dt>
						<dd className="font-medium">
							{destination.name}{' '}
							<span className="font-mono text-xs text-muted-foreground">{destination.code}</span>
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Supplier</dt>
						<dd className="font-medium">
							{supplier ? `${supplier.name} (${supplier.code})` : '—'}
						</dd>
					</div>
					<div>
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
							<th className="px-3 py-2 text-right font-medium">Harga Satuan</th>
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
									<td className="px-3 py-2 text-right font-mono tabular-nums">{line.qty}</td>
									<td className="px-3 py-2">{uom?.code ?? `#${line.uomId}`}</td>
									<td className="px-3 py-2 text-right">
										<CurrencyDisplay value={line.unitCost || '0'} />
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{/* Totals are computed by the server on save (ADR-0017). */}
			<form.FormError />
		</div>
	)
}

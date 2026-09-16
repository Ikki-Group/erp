import { useQuery } from '@tanstack/react-query'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

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

// ─── Step 1: Supplier & Notes ───

export function ReceivingStepSupplier({ form }: { form: ReceivingWizardForm }) {
	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
	const supplierOptions = (suppliersQuery.data?.data ?? [])
		.filter((s) => s.isActive)
		.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))

	return (
		<div className="grid gap-4">
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
					<div className="flex items-center justify-between">
						<Label>Item Penerimaan</Label>
						<div className="flex gap-2">
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
						{linesField.state.value.map((_, i) => (
							<div key={i} className="flex items-start gap-2 rounded-md border p-3">
								<div className="flex-1">
									<form.AppField name={`lines[${i}].materialId`}>
										{(field) => (
											<field.IdSelectField
												label={i === 0 ? 'Material' : '\u00A0'}
												options={materialOptions}
												placeholder="Pilih material"
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
								<div className="w-36">
									<form.AppField name={`lines[${i}].unitCost`}>
										{(field) => <field.CurrencyField label={i === 0 ? 'Harga Satuan' : '\u00A0'} />}
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

export function ReceivingStepReview({ form }: { form: ReceivingWizardForm }) {
	const values = form.store.state.values

	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const supplier = (suppliersQuery.data?.data ?? []).find((s) => s.id === values.supplierId)
	const getMaterial = (id: number | null) =>
		(materialsQuery.data?.data ?? []).find((m) => m.id === id)
	const getUom = (id: number | null) => (uomsQuery.data?.data ?? []).find((u) => u.id === id)

	const total = values.lines.reduce(
		(sum, l) => sum + Number(l.qty || 0) * Number(l.unitCost || 0),
		0,
	)

	return (
		<div className="space-y-4">
			<div className="rounded-md border p-4">
				<dl className="grid grid-cols-2 gap-3 text-sm">
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
							<th className="px-3 py-2 text-right font-medium">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{values.lines.map((line, i) => {
							const material = getMaterial(line.materialId)
							const uom = getUom(line.uomId)
							const subtotal = Number(line.qty || 0) * Number(line.unitCost || 0)
							return (
								<tr key={i} className="border-t">
									<td className="px-3 py-2">
										{material ? `${material.name} (${material.code})` : `#${line.materialId}`}
									</td>
									<td className="px-3 py-2 text-right">{line.qty}</td>
									<td className="px-3 py-2">{uom?.code ?? `#${line.uomId}`}</td>
									<td className="px-3 py-2 text-right">
										{Number(line.unitCost || 0).toLocaleString('id-ID')}
									</td>
									<td className="px-3 py-2 text-right font-medium">
										{subtotal.toLocaleString('id-ID')}
									</td>
								</tr>
							)
						})}
					</tbody>
					<tfoot className="border-t bg-muted/30">
						<tr>
							<td colSpan={4} className="px-3 py-2 text-right font-medium">
								Total
							</td>
							<td className="px-3 py-2 text-right font-medium">{total.toLocaleString('id-ID')}</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<form.FormError />
		</div>
	)
}

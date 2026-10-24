import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'

import { z } from 'zod'

import { toDisplayCurrency } from '@/lib/currency.ts'
import { useEntityForm } from '@/lib/form/index.ts'

import {
	createLineItem,
	LineItemEditor,
	type LineItem,
} from '@/components/shared/line-item-editor.tsx'

import { Button } from '@/components/ui/button'

import { MaterialLookupField } from '@/features/material/components/material-lookup-field.tsx'
import { pricingResource, supplierResource } from '@/features/supplier/api.ts'
import { SupplierLookupField } from '@/features/supplier/components/supplier-lookup-field.tsx'
import { UomLookupField } from '@/features/uom/components/uom-lookup-field.tsx'

import { calculateReceivingAmounts } from '../receiving-amounts.ts'
import { InventoryLineMaterial, InventoryLineUom } from './inventory-line-labels.tsx'

// ─── Values / Schema ───

export interface ReceivingLineValues extends LineItem {
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

export function makeReceivingLineValues(): ReceivingLineValues {
	return createLineItem({ materialId: null, qty: '', unitCost: '', uomId: null })
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
	return (
		<div className="grid gap-4">
			<form.AppField name="supplierId">
				{() => <SupplierLookupField label="Supplier" placeholder="Pilih supplier" />}
			</form.AppField>
			<form.AppField name="notes">
				{(field) => <field.TextField label="Catatan" placeholder="Opsional" />}
			</form.AppField>
		</div>
	)
}

// ─── Step 2: Lines ───

export function ReceivingStepLines({ form }: { form: ReceivingWizardForm }) {
	const supplierId = useStore(form.store, (state) => state.values.supplierId)
	const pricingQuery = useQuery({
		...pricingResource.list.queryOptions({
			supplierId: supplierId ?? undefined,
			page: 1,
			limit: 200,
		}),
		enabled: supplierId !== null,
		throwOnError: false,
	})

	return (
		<form.AppField name="lines" mode="array">
			{(linesField) => (
				<LineItemEditor
					label="Item Penerimaan"
					rows={linesField.state.value}
					createRow={makeReceivingLineValues}
					onAdd={(row) => linesField.pushValue(row)}
					onRemove={(index) => linesField.removeValue(index)}
					errors={linesField.state.meta.errors}
					fieldCount={4}
					emptyMessage="Belum ada item. Tambah baris manual atau muat dari katalog supplier."
					actions={
						supplierId !== null && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={pricingQuery.isLoading || !pricingQuery.data?.data.length}
								onClick={() => {
									for (const price of pricingQuery.data?.data ?? []) {
										linesField.pushValue(
											createLineItem({
												materialId: price.materialId,
												qty: '',
												unitCost: price.unitPrice,
												uomId: price.uomId,
											}),
										)
									}
								}}
							>
								Muat dari katalog supplier
							</Button>
						)
					}
					renderFields={(_, index) => (
						<>
							<form.AppField name={`lines[${index}].materialId`}>
								{() => <MaterialLookupField label="Material" placeholder="Pilih material" />}
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
							<form.AppField name={`lines[${index}].unitCost`}>
								{(field) => <field.CurrencyField label="Harga Satuan" />}
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

export function ReceivingStepReview({ form }: { form: ReceivingWizardForm }) {
	const values = useStore(form.store, (state) => state.values)
	const supplierQuery = useQuery({
		...supplierResource.detail.queryOptions({ id: values.supplierId! }),
		enabled: values.supplierId !== null,
		throwOnError: false,
	})
	const supplier = supplierQuery.data?.data
	const amounts = calculateReceivingAmounts(values.lines)

	return (
		<div className="space-y-4">
			<div className="rounded-md border p-4">
				<dl className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt className="text-muted-foreground">Supplier</dt>
						<dd className="font-medium">
							{supplier
								? `${supplier.name} (${supplier.code})`
								: values.supplierId !== null
									? `#${values.supplierId}`
									: '—'}
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
						{values.lines.map((line, index) => (
							<tr key={line.clientKey} className="border-t">
								<td className="px-3 py-2">
									<InventoryLineMaterial id={line.materialId} />
								</td>
								<td className="px-3 py-2 text-right font-mono tabular-nums">{line.qty}</td>
								<td className="px-3 py-2">
									<InventoryLineUom id={line.uomId} />
								</td>
								<td className="px-3 py-2 text-right font-mono tabular-nums">
									{toDisplayCurrency(line.unitCost) || '—'}
								</td>
								<td className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
									{amounts.subtotals[index] === undefined
										? '—'
										: toDisplayCurrency(amounts.subtotals[index])}
								</td>
							</tr>
						))}
					</tbody>
					<tfoot className="border-t bg-muted/30">
						<tr>
							<td colSpan={4} className="px-3 py-2 text-right font-medium">
								Total
							</td>
							<td className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
								{amounts.total === undefined ? '—' : toDisplayCurrency(amounts.total)}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<form.FormError />
		</div>
	)
}

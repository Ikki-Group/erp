import { useQuery } from '@tanstack/react-query'

import { PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'

import { materialResource } from '@/features/material/api.ts'
import { menuItemResource } from '@/features/menu/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import type { RecipeDetailDto } from '../dto/index.ts'

// ─── Values / Schema ───

export interface RecipeLineValues {
	materialId: number | null
	quantity: string
	uomId: number | null
}

export interface RecipeFormValues {
	menuItemId: number | null
	name: string
	yieldQty: string
	lines: RecipeLineValues[]
}

const decimal = (message: string) =>
	z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, message)

const RecipeLineSchema = z.object({
	materialId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Material wajib dipilih' }),
	quantity: decimal('Jumlah harus angka positif'),
	uomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Satuan wajib dipilih' }),
})

const RecipeFormSchema = z.object({
	menuItemId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Menu item wajib dipilih' }),
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(255),
	yieldQty: decimal('Yield qty harus angka positif'),
	lines: z.array(RecipeLineSchema).min(1, 'Tambahkan minimal satu bahan'),
})

function emptyLine(): RecipeLineValues {
	return { materialId: null, quantity: '', uomId: null }
}

function toFormValues(defaultValues?: RecipeDetailDto): RecipeFormValues {
	if (!defaultValues) {
		return { menuItemId: null, name: '', yieldQty: '1', lines: [emptyLine()] }
	}
	return {
		menuItemId: defaultValues.menuItemId,
		name: defaultValues.name,
		yieldQty: defaultValues.yieldQty,
		lines: defaultValues.lines.map((l) => ({
			materialId: l.materialId,
			quantity: l.quantity,
			uomId: l.uomId,
		})),
	}
}

export interface RecipeFormBodyProps {
	locationId: number
	defaultValues?: RecipeDetailDto
	onSaved: () => void
	onCancel: () => void
	onSubmitValues: (values: {
		menuItemId: number
		name: string
		yieldQty: string
		lines: { materialId: number; quantity: string; uomId: number }[]
	}) => Promise<unknown>
}

/** Recipe (BOM) form — menu item + dynamic ingredient lines. Kept as a dialog. */
export function RecipeFormBody({
	locationId,
	defaultValues,
	onSaved,
	onCancel,
	onSubmitValues,
}: RecipeFormBodyProps) {
	const menuItemsQuery = useQuery({
		...menuItemResource.list.queryOptions({ page: 1, limit: 200, locationId }),
		enabled: !!locationId,
	})
	const materialsQuery = useQuery({
		...materialResource.list.queryOptions({ page: 1, limit: 200, locationId }),
		enabled: !!locationId,
	})
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 200 }))

	const menuItemOptions = (menuItemsQuery.data?.data ?? []).map((m) => ({
		label: `${m.name} (${m.sku})`,
		value: m.id,
	}))
	const materialOptions = (materialsQuery.data?.data ?? []).map((m) => ({
		label: `${m.name} (${m.code})`,
		value: m.id,
	}))
	const uomOptions = (uomsQuery.data?.data ?? []).map((u) => ({
		label: `${u.name} (${u.code})`,
		value: u.id,
	}))

	const form = useEntityForm<RecipeFormValues>({
		defaultValues: toFormValues(defaultValues),
		schema: RecipeFormSchema,
		onSubmit: async (values) => {
			await onSubmitValues({
				menuItemId: values.menuItemId!,
				name: values.name,
				yieldQty: values.yieldQty,
				lines: values.lines.map((l) => ({
					materialId: l.materialId!,
					quantity: l.quantity,
					uomId: l.uomId!,
				})),
			})
			onSaved()
		},
	})

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="grid gap-4"
			>
				<form.AppField name="menuItemId">
					{(field) => (
						<field.IdSelectField
							label="Menu Item"
							options={menuItemOptions}
							placeholder="Pilih menu item..."
							disabled={!!defaultValues}
						/>
					)}
				</form.AppField>

				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="name">
						{(field) => (
							<field.TextField label="Nama Resep" placeholder="e.g. Es Kopi Susu Standard" />
						)}
					</form.AppField>
					<form.AppField name="yieldQty">
						{(field) => <field.TextField label="Yield Qty" placeholder="e.g. 1" />}
					</form.AppField>
				</div>

				<form.AppField name="lines" mode="array">
					{(linesField) => (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Bahan (Ingredients)</span>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => linesField.pushValue(emptyLine())}
								>
									<PlusIcon className="size-4" />
									Tambah Bahan
								</Button>
							</div>

							{linesField.state.value.map((_, idx) => (
								<div key={idx} className="flex items-end gap-2">
									<div className="flex-1">
										<form.AppField name={`lines[${idx}].materialId`}>
											{(field) => (
												<field.IdSelectField
													label={idx === 0 ? 'Material' : '\u00A0'}
													options={materialOptions}
													placeholder="Pilih material..."
												/>
											)}
										</form.AppField>
									</div>
									<div className="w-24">
										<form.AppField name={`lines[${idx}].quantity`}>
											{(field) => (
												<field.TextField label={idx === 0 ? 'Qty' : '\u00A0'} placeholder="0.5" />
											)}
										</form.AppField>
									</div>
									<div className="w-32">
										<form.AppField name={`lines[${idx}].uomId`}>
											{(field) => (
												<field.IdSelectField
													label={idx === 0 ? 'UoM' : '\u00A0'}
													options={uomOptions}
													placeholder="Satuan..."
												/>
											)}
										</form.AppField>
									</div>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="size-9 shrink-0"
										onClick={() => linesField.removeValue(idx)}
										disabled={linesField.state.value.length <= 1}
									>
										<TrashIcon className="size-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</form.AppField>

				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Simpan" />
			</form>
		</form.AppForm>
	)
}

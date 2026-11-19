import { z } from 'zod'

import { useEntityEditor } from '@/lib/form/use-entity-editor'

import { UomLookupField } from '@/features/uom/components/uom-lookup-field'

import { materialResource } from '../api.ts'
import { MATERIAL_TYPE_OPTIONS, MaterialCreateDto, MaterialTypeEnum } from '../dto/index.ts'
import type { MaterialDto } from '../dto/index.ts'
import { CategoryLookupField } from './category-lookup-field'

export interface MaterialFormValues {
	code: string
	name: string
	type: 'raw' | 'semi_finished'
	categoryId: number | null
	baseUomId: number | null
	defaultPurchaseUomId: number | null
	defaultStockUomId: number | null
	defaultRecipeUomId: number | null
	minStock: string
	isActive: boolean
}

/** Form state remains separate from the wire DTO so incomplete inputs have helpful errors. */
const MaterialFormSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(255),
	type: MaterialTypeEnum,
	categoryId: z.number().int().positive().nullable(),
	baseUomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Satuan dasar wajib diisi' }),
	defaultPurchaseUomId: z.number().int().positive().nullable(),
	defaultStockUomId: z.number().int().positive().nullable(),
	defaultRecipeUomId: z.number().int().positive().nullable(),
	minStock: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Harus berupa angka desimal positif')
		.or(z.literal(''))
		.default(''),
	isActive: z.boolean(),
})

export const EMPTY_MATERIAL_FORM_VALUES: MaterialFormValues = {
	code: '',
	name: '',
	type: 'raw',
	categoryId: null,
	baseUomId: null,
	defaultPurchaseUomId: null,
	defaultStockUomId: null,
	defaultRecipeUomId: null,
	minStock: '',
	isActive: true,
}

export function toMaterialFormValues(material: MaterialDto): MaterialFormValues {
	return {
		code: material.code,
		name: material.name,
		type: material.type,
		categoryId: material.categoryId,
		baseUomId: material.baseUomId,
		defaultPurchaseUomId: material.defaultPurchaseUomId,
		defaultStockUomId: material.defaultStockUomId,
		defaultRecipeUomId: material.defaultRecipeUomId,
		minStock: material.minStock ?? '',
		isActive: material.isActive,
	}
}

export function toMaterialInput(values: MaterialFormValues): MaterialCreateDto {
	return MaterialCreateDto.parse({ ...values, minStock: values.minStock.trim() || null })
}

export function useMaterialForm({
	material,
	onSaved,
}: {
	material?: MaterialDto
	onSaved: () => void | Promise<void>
}) {
	return useEntityEditor({
		defaultValues: material ? toMaterialFormValues(material) : EMPTY_MATERIAL_FORM_VALUES,
		schema: MaterialFormSchema,
		mutation: {
			mutationFn: (input: MaterialCreateDto) =>
				material
					? materialResource.update.fetch({ ...input, id: material.id })
					: materialResource.create.fetch(input),
		},
		toPayload: toMaterialInput,
		successMessage: material ? 'Bahan berhasil diperbarui.' : 'Bahan berhasil dibuat.',
		onSaved,
	})
}

export type MaterialForm = ReturnType<typeof useMaterialForm>

interface MaterialFormFieldsProps {
	form: MaterialForm
}

/** The material form's field layout. Shared by the full-page and dialog entry points. */
export function MaterialFormFields({ form }: MaterialFormFieldsProps) {
	return (
		<div className="grid gap-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Kode" placeholder="mis. MAT-001" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Tipe" options={[...MATERIAL_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Nama" placeholder="mis. Tepung Terigu" />}
			</form.AppField>

			<form.AppField name="categoryId">
				{() => (
					<CategoryLookupField
						label="Kategori"
						placeholder="Pilih kategori..."
						description="Opsional. Kosongkan pilihan untuk tanpa kategori."
					/>
				)}
			</form.AppField>

			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="baseUomId">
					{() => <UomLookupField label="Satuan Dasar" placeholder="Pilih satuan..." />}
				</form.AppField>
				<form.AppField name="defaultPurchaseUomId">
					{() => <UomLookupField label="Satuan Pembelian" placeholder="Sama dengan dasar" />}
				</form.AppField>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="defaultStockUomId">
					{() => <UomLookupField label="Satuan Stok" placeholder="Sama dengan dasar" />}
				</form.AppField>
				<form.AppField name="defaultRecipeUomId">
					{() => <UomLookupField label="Satuan Resep" placeholder="Sama dengan dasar" />}
				</form.AppField>
			</div>

			<form.AppField name="minStock">
				{(field) => (
					<field.TextField
						label="Stok Minimum"
						placeholder="mis. 10.5 (opsional)"
						inputMode="decimal"
						className="text-right font-mono tabular-nums"
					/>
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Aktif"
						description="Apakah bahan ini tersedia untuk digunakan."
					/>
				)}
			</form.AppField>
		</div>
	)
}

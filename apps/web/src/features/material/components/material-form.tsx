import { forwardRef, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { uomResource } from '@/features/uom/api.ts'

import { categoryResource } from '../api.ts'
import { MATERIAL_TYPE_OPTIONS, MaterialCreateDto } from '../dto/index.ts'

import type { FormSelectOption } from '@/components/form/form-select'
import type { MaterialDto, MaterialTypeEnum } from '../dto/index.ts'

export interface MaterialFormValues {
	code: string
	name: string
	type: MaterialTypeEnum
	categoryId: string
	baseUomId: string
	defaultPurchaseUomId: string
	defaultStockUomId: string
	defaultRecipeUomId: string
	minStock: string
}

export interface MaterialFormRef {
	getValues: () => MaterialFormValues
	validate: () => Record<string, string> | null
}

interface MaterialFormProps {
	defaultValues?: MaterialDto
}

export const MaterialForm = forwardRef<MaterialFormRef, MaterialFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<MaterialFormValues>({
			code: defaultValues?.code ?? '',
			name: defaultValues?.name ?? '',
			type: defaultValues?.type ?? 'raw',
			categoryId: defaultValues?.categoryId?.toString() ?? '',
			baseUomId: defaultValues?.baseUomId?.toString() ?? '',
			defaultPurchaseUomId: defaultValues?.defaultPurchaseUomId?.toString() ?? '',
			defaultStockUomId: defaultValues?.defaultStockUomId?.toString() ?? '',
			defaultRecipeUomId: defaultValues?.defaultRecipeUomId?.toString() ?? '',
			minStock: defaultValues?.minStock ?? '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const categoriesQuery = useQuery(categoryResource.list.queryOptions({ page: 1, limit: 100 }))
		const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

		const categoryOptions: FormSelectOption[] = (categoriesQuery.data?.data ?? []).map((c) => ({
			label: c.name,
			value: c.id.toString(),
		}))

		const uomOptions: FormSelectOption[] = (uomQuery.data?.data ?? []).map((u) => ({
			label: `${u.name} (${u.code})`,
			value: u.id.toString(),
		}))

		const update = (field: keyof MaterialFormValues, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const payload = {
					code: values.code,
					name: values.name,
					type: values.type,
					categoryId: values.categoryId ? Number(values.categoryId) : null,
					baseUomId: values.baseUomId ? Number(values.baseUomId) : 0,
					defaultPurchaseUomId: values.defaultPurchaseUomId
						? Number(values.defaultPurchaseUomId)
						: null,
					defaultStockUomId: values.defaultStockUomId
						? Number(values.defaultStockUomId)
						: null,
					defaultRecipeUomId: values.defaultRecipeUomId
						? Number(values.defaultRecipeUomId)
						: null,
					minStock: values.minStock || null,
				}
				const result = MaterialCreateDto.safeParse(payload)
				if (result.success) {
					setErrors({})
					return null
				}
				const fieldErrors: Record<string, string> = {}
				for (const issue of result.error.issues) {
					const path = issue.path[0]
					if (path && !fieldErrors[String(path)]) {
						fieldErrors[String(path)] = issue.message
					}
				}
				setErrors(fieldErrors)
				return fieldErrors
			},
		}))

		return (
			<div className="grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Code"
						value={values.code}
						onChange={(e) => update('code', e.target.value)}
						error={errors.code}
						placeholder="e.g. MAT-001"
					/>
					<FormSelect
						label="Type"
						options={[...MATERIAL_TYPE_OPTIONS]}
						value={values.type}
						onValueChange={(v) => v && update('type', v)}
						error={errors.type}
					/>
				</div>
				<FormInput
					label="Name"
					value={values.name}
					onChange={(e) => update('name', e.target.value)}
					error={errors.name}
					placeholder="e.g. Tepung Terigu"
				/>
				<FormSelect
					label="Category"
					options={[{ label: '— None —', value: '' }, ...categoryOptions]}
					value={values.categoryId}
					onValueChange={(v) => update('categoryId', v ?? '')}
					error={errors.categoryId}
					placeholder="Select category..."
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormSelect
						label="Base UoM"
						options={uomOptions}
						value={values.baseUomId}
						onValueChange={(v) => v && update('baseUomId', v)}
						error={errors.baseUomId}
						placeholder="Select unit..."
					/>
					<FormSelect
						label="Purchase UoM"
						options={[{ label: '— Same as base —', value: '' }, ...uomOptions]}
						value={values.defaultPurchaseUomId}
						onValueChange={(v) => update('defaultPurchaseUomId', v ?? '')}
						error={errors.defaultPurchaseUomId}
						placeholder="Select unit..."
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<FormSelect
						label="Stock UoM"
						options={[{ label: '— Same as base —', value: '' }, ...uomOptions]}
						value={values.defaultStockUomId}
						onValueChange={(v) => update('defaultStockUomId', v ?? '')}
						error={errors.defaultStockUomId}
						placeholder="Select unit..."
					/>
					<FormSelect
						label="Recipe UoM"
						options={[{ label: '— Same as base —', value: '' }, ...uomOptions]}
						value={values.defaultRecipeUomId}
						onValueChange={(v) => update('defaultRecipeUomId', v ?? '')}
						error={errors.defaultRecipeUomId}
						placeholder="Select unit..."
					/>
				</div>
				<FormInput
					label="Min Stock"
					value={values.minStock}
					onChange={(e) => update('minStock', e.target.value)}
					error={errors.minStock}
					placeholder="e.g. 10.5 (optional)"
				/>
			</div>
		)
	},
)

MaterialForm.displayName = 'MaterialForm'

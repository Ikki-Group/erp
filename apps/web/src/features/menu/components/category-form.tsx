import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { MenuCategoryCreateDto } from '../dto/index.ts'
import type { MenuCategoryDto } from '../dto/index.ts'

export interface CategoryFormValues {
	name: string
	sortOrder: number
}

export interface CategoryFormRef {
	getValues: () => CategoryFormValues
	validate: () => Record<string, string> | null
}

interface CategoryFormProps {
	defaultValues?: MenuCategoryDto
}

export const CategoryForm = forwardRef<CategoryFormRef, CategoryFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<CategoryFormValues>({
			name: defaultValues?.name ?? '',
			sortOrder: defaultValues?.sortOrder ?? 0,
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof CategoryFormValues, value: string | number) => {
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
					locationId: 1,
					name: values.name,
					sortOrder: values.sortOrder,
				}
				const result = MenuCategoryCreateDto.safeParse(payload)
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
				<FormInput
					label="Nama Kategori"
					value={values.name}
					onChange={(e) => update('name', e.target.value)}
					error={errors.name}
					placeholder="e.g. Minuman, Makanan Berat"
				/>
				<FormInput
					label="Urutan"
					value={values.sortOrder.toString()}
					onChange={(e) => update('sortOrder', Number(e.target.value) || 0)}
					error={errors.sortOrder}
					placeholder="0"
				/>
			</div>
		)
	},
)

CategoryForm.displayName = 'CategoryForm'

import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { MaterialCategoryCreateDto } from '../dto/index.ts'

import type { MaterialCategoryDto } from '../dto/index.ts'

export interface CategoryFormValues {
	name: string
}

export interface CategoryFormRef {
	getValues: () => CategoryFormValues
	validate: () => Record<string, string> | null
}

interface CategoryFormProps {
	defaultValues?: MaterialCategoryDto
}

export const CategoryForm = forwardRef<CategoryFormRef, CategoryFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<CategoryFormValues>({
			name: defaultValues?.name ?? '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof CategoryFormValues, value: string) => {
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
				const result = MaterialCategoryCreateDto.safeParse(values)
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
					label="Name"
					value={values.name}
					onChange={(e) => update('name', e.target.value)}
					error={errors.name}
					placeholder="e.g. Bahan Kering"
				/>
			</div>
		)
	},
)

CategoryForm.displayName = 'CategoryForm'

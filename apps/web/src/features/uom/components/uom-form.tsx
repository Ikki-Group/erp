import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'

import { UOM_CATEGORY_OPTIONS, UomCreateDto } from '../dto/index.ts'

import type { UomDto } from '../dto/index.ts'

export interface UomFormValues {
	code: string
	name: string
	category: string
}

export interface UomFormRef {
	getValues: () => UomFormValues
	validate: () => Record<string, string> | null
}

interface UomFormProps {
	defaultValues?: UomDto
}

export const UomForm = forwardRef<UomFormRef, UomFormProps>(({ defaultValues }, ref) => {
	const [values, setValues] = useState<UomFormValues>({
		code: defaultValues?.code ?? '',
		name: defaultValues?.name ?? '',
		category: defaultValues?.category ?? 'quantity',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})

	const update = (field: keyof UomFormValues, value: string) => {
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
			const result = UomCreateDto.safeParse(values)
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
					placeholder="e.g. kg"
				/>
				<FormSelect
					label="Category"
					options={[...UOM_CATEGORY_OPTIONS]}
					value={values.category}
					onValueChange={(v) => v && update('category', v)}
					error={errors.category}
				/>
			</div>
			<FormInput
				label="Name"
				value={values.name}
				onChange={(e) => update('name', e.target.value)}
				error={errors.name}
				placeholder="e.g. Kilogram"
			/>
		</div>
	)
})

UomForm.displayName = 'UomForm'

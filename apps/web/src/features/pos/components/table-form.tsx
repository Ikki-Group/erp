import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSwitch } from '@/components/form/form-switch'

import { TableCreateDto } from '../dto/index.ts'

import type { TableDto } from '../dto/index.ts'

export interface TableFormValues {
	number: string
	capacity: string
	isActive: boolean
}

export interface TableFormRef {
	getValues: () => TableFormValues
	validate: () => Record<string, string> | null
}

interface TableFormProps {
	defaultValues?: TableDto
}

export const TableForm = forwardRef<TableFormRef, TableFormProps>(({ defaultValues }, ref) => {
	const [values, setValues] = useState<TableFormValues>({
		number: defaultValues?.number ?? '',
		capacity: defaultValues?.capacity?.toString() ?? '4',
		isActive: defaultValues?.isActive ?? true,
	})
	const [errors, setErrors] = useState<Record<string, string>>({})

	const update = (field: keyof TableFormValues, value: string | boolean) => {
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
			const result = TableCreateDto.omit({ locationId: true }).safeParse({
				number: values.number,
				capacity: Number(values.capacity),
				isActive: values.isActive,
			})
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
				label="Number / Name"
				value={values.number}
				onChange={(e) => update('number', e.target.value)}
				error={errors.number}
				placeholder="e.g. T-01 or Table 1"
			/>
			<FormInput
				label="Capacity"
				type="number"
				value={values.capacity}
				onChange={(e) => update('capacity', e.target.value)}
				error={errors.capacity}
				placeholder="4"
			/>
			<FormSwitch
				label="Active"
				description="Inactive tables won't appear in POS"
				checked={values.isActive}
				onCheckedChange={(v) => update('isActive', v)}
			/>
		</div>
	)
})

TableForm.displayName = 'TableForm'

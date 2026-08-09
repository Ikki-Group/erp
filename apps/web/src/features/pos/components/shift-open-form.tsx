import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { ShiftOpenDto } from '../dto/index.ts'

export interface ShiftOpenFormValues {
	openingCash: string
}

export interface ShiftOpenFormRef {
	getValues: () => ShiftOpenFormValues
	validate: () => Record<string, string> | null
}

export const ShiftOpenForm = forwardRef<ShiftOpenFormRef>((_props, ref) => {
	const [values, setValues] = useState<ShiftOpenFormValues>({
		openingCash: '0',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})

	const update = (field: keyof ShiftOpenFormValues, value: string) => {
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
			const result = ShiftOpenDto.omit({ locationId: true }).safeParse({
				openingCash: Number(values.openingCash),
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
				label="Opening Cash"
				type="number"
				value={values.openingCash}
				onChange={(e) => update('openingCash', e.target.value)}
				error={errors.openingCash}
				placeholder="0"
			/>
		</div>
	)
})

ShiftOpenForm.displayName = 'ShiftOpenForm'

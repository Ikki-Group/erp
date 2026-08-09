import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'

import { UomConversionCreateDto } from '../dto/index.ts'

import type { UomDto } from '../dto/index.ts'

export interface ConversionFormValues {
	fromUomId: string
	toUomId: string
	factor: string
}

export interface ConversionFormRef {
	getValues: () => ConversionFormValues
	validate: () => Record<string, string> | null
}

interface ConversionFormProps {
	units: UomDto[]
}

export const ConversionForm = forwardRef<ConversionFormRef, ConversionFormProps>(
	({ units }, ref) => {
		const [values, setValues] = useState<ConversionFormValues>({
			fromUomId: '',
			toUomId: '',
			factor: '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const unitOptions = units.map((u) => ({ label: `${u.name} (${u.code})`, value: String(u.id) }))

		const update = (field: keyof ConversionFormValues, value: string) => {
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
					fromUomId: Number(values.fromUomId) || 0,
					toUomId: Number(values.toUomId) || 0,
					factor: values.factor,
				}
				const result = UomConversionCreateDto.safeParse(payload)
				if (result.success) {
					if (payload.fromUomId === payload.toUomId) {
						const fieldErrors = { toUomId: 'Must differ from source unit' }
						setErrors(fieldErrors)
						return fieldErrors
					}
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
					<FormSelect
						label="From Unit"
						options={unitOptions}
						value={values.fromUomId}
						onValueChange={(v) => v && update('fromUomId', v)}
						error={errors.fromUomId}
						placeholder="Select unit"
					/>
					<FormSelect
						label="To Unit"
						options={unitOptions}
						value={values.toUomId}
						onValueChange={(v) => v && update('toUomId', v)}
						error={errors.toUomId}
						placeholder="Select unit"
					/>
				</div>
				<FormInput
					label="Factor"
					value={values.factor}
					onChange={(e) => update('factor', e.target.value)}
					error={errors.factor}
					placeholder="e.g. 1000 (1 from = 1000 to)"
				/>
			</div>
		)
	},
)

ConversionForm.displayName = 'ConversionForm'

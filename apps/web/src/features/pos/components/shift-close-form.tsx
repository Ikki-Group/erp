import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { ShiftCloseDto } from '../dto/index.ts'

export interface ShiftCloseFormValues {
	closingCash: string
	notes: string
}

export interface ShiftCloseFormRef {
	getValues: () => ShiftCloseFormValues
	validate: () => Record<string, string> | null
}

interface ShiftCloseFormProps {
	expectedCash?: string | null
}

export const ShiftCloseForm = forwardRef<ShiftCloseFormRef, ShiftCloseFormProps>(
	({ expectedCash }, ref) => {
		const [values, setValues] = useState<ShiftCloseFormValues>({
			closingCash: '',
			notes: '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof ShiftCloseFormValues, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		const difference =
			values.closingCash && expectedCash
				? Number(values.closingCash) - Number(expectedCash)
				: null

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const result = ShiftCloseDto.omit({ shiftId: true }).safeParse({
					closingCash: Number(values.closingCash),
					notes: values.notes || undefined,
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
				{expectedCash && (
					<div className="rounded-md border bg-muted/50 p-3 text-sm">
						<span className="text-muted-foreground">Expected cash: </span>
						<span className="font-medium">
							{Number(expectedCash).toLocaleString('id-ID')}
						</span>
					</div>
				)}
				<FormInput
					label="Closing Cash"
					type="number"
					value={values.closingCash}
					onChange={(e) => update('closingCash', e.target.value)}
					error={errors.closingCash}
					placeholder="Count the cash drawer"
				/>
				{difference !== null && (
					<div className="rounded-md border p-3 text-sm">
						<span className="text-muted-foreground">Difference: </span>
						<span
							className={
								difference === 0
									? 'font-medium text-green-600'
									: difference < 0
										? 'font-medium text-red-600'
										: 'font-medium text-amber-600'
							}
						>
							{difference > 0 ? '+' : ''}
							{difference.toLocaleString('id-ID')}
						</span>
					</div>
				)}
				<FormInput
					label="Notes"
					value={values.notes}
					onChange={(e) => update('notes', e.target.value)}
					error={errors.notes}
					placeholder="Optional notes"
				/>
			</div>
		)
	},
)

ShiftCloseForm.displayName = 'ShiftCloseForm'

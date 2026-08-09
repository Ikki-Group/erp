import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

import { PAYMENT_METHOD_TYPE_OPTIONS, PaymentMethodCreateDto } from '../dto/index.ts'

import type { PaymentMethodDto } from '../dto/index.ts'

export interface PaymentMethodFormValues {
	code: string
	name: string
	type: string
	isActive: boolean
}

export interface PaymentMethodFormRef {
	getValues: () => PaymentMethodFormValues
	validate: () => Record<string, string> | null
}

interface PaymentMethodFormProps {
	defaultValues?: PaymentMethodDto
}

export const PaymentMethodForm = forwardRef<PaymentMethodFormRef, PaymentMethodFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<PaymentMethodFormValues>({
			code: defaultValues?.code ?? '',
			name: defaultValues?.name ?? '',
			type: defaultValues?.type ?? 'cash',
			isActive: defaultValues?.isActive ?? true,
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof PaymentMethodFormValues, value: string | boolean) => {
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
				const result = PaymentMethodCreateDto.safeParse(values)
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
						placeholder="e.g. CASH"
					/>
					<FormSelect
						label="Type"
						options={[...PAYMENT_METHOD_TYPE_OPTIONS]}
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
					placeholder="e.g. Cash"
				/>
				<FormSwitch
					label="Active"
					description="Inactive methods won't appear in POS checkout."
					checked={values.isActive}
					onCheckedChange={(checked) => update('isActive', checked)}
				/>
			</div>
		)
	},
)

PaymentMethodForm.displayName = 'PaymentMethodForm'

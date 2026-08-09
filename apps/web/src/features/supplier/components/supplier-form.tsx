import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { SupplierCreateDto } from '../dto/index.ts'
import type { SupplierDto } from '../dto/index.ts'

export interface SupplierFormValues {
	code: string
	name: string
	contactPerson: string
	phone: string
	email: string
	address: string
	paymentTerms: string
}

export interface SupplierFormRef {
	getValues: () => SupplierFormValues
	validate: () => Record<string, string> | null
}

interface SupplierFormProps {
	defaultValues?: SupplierDto
}

export const SupplierForm = forwardRef<SupplierFormRef, SupplierFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<SupplierFormValues>({
			code: defaultValues?.code ?? '',
			name: defaultValues?.name ?? '',
			contactPerson: defaultValues?.contactPerson ?? '',
			phone: defaultValues?.phone ?? '',
			email: defaultValues?.email ?? '',
			address: defaultValues?.address ?? '',
			paymentTerms: defaultValues?.paymentTerms?.toString() ?? '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof SupplierFormValues, value: string) => {
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
					contactPerson: values.contactPerson || null,
					phone: values.phone || null,
					email: values.email || null,
					address: values.address || null,
					paymentTerms: values.paymentTerms ? Number(values.paymentTerms) : null,
				}
				const result = SupplierCreateDto.safeParse(payload)
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
						placeholder="e.g. SUP-001"
					/>
					<FormInput
						label="Name"
						value={values.name}
						onChange={(e) => update('name', e.target.value)}
						error={errors.name}
						placeholder="e.g. PT Sumber Makmur"
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Contact Person"
						value={values.contactPerson}
						onChange={(e) => update('contactPerson', e.target.value)}
						error={errors.contactPerson}
						placeholder="Optional"
					/>
					<FormInput
						label="Phone"
						value={values.phone}
						onChange={(e) => update('phone', e.target.value)}
						error={errors.phone}
						placeholder="Optional"
					/>
				</div>
				<FormInput
					label="Email"
					value={values.email}
					onChange={(e) => update('email', e.target.value)}
					error={errors.email}
					placeholder="Optional"
				/>
				<FormInput
					label="Address"
					value={values.address}
					onChange={(e) => update('address', e.target.value)}
					error={errors.address}
					placeholder="Optional"
				/>
				<FormInput
					label="Payment Terms (days)"
					type="number"
					value={values.paymentTerms}
					onChange={(e) => update('paymentTerms', e.target.value)}
					error={errors.paymentTerms}
					placeholder="e.g. 30"
				/>
			</div>
		)
	},
)

SupplierForm.displayName = 'SupplierForm'

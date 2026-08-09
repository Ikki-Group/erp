import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

import { LOCATION_TYPE_OPTIONS, LocationCreateDto } from '../dto/index.ts'

import type { LocationDto } from '../dto/index.ts'

export interface LocationFormValues {
	code: string
	name: string
	type: string
	address: string
	phone: string
	isActive: boolean
}

export interface LocationFormRef {
	getValues: () => LocationFormValues
	validate: () => Record<string, string> | null
}

interface LocationFormProps {
	defaultValues?: LocationDto
}

export const LocationForm = forwardRef<LocationFormRef, LocationFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<LocationFormValues>({
			code: defaultValues?.code ?? '',
			name: defaultValues?.name ?? '',
			type: defaultValues?.type ?? 'store',
			address: defaultValues?.address ?? '',
			phone: defaultValues?.phone ?? '',
			isActive: defaultValues?.isActive ?? true,
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof LocationFormValues, value: string | boolean) => {
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
				const result = LocationCreateDto.safeParse({
					...values,
					address: values.address || null,
					phone: values.phone || null,
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
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Code"
						value={values.code}
						onChange={(e) => update('code', e.target.value)}
						error={errors.code}
						placeholder="e.g. LOC-001"
					/>
					<FormSelect
						label="Type"
						options={[...LOCATION_TYPE_OPTIONS]}
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
					placeholder="Location name"
				/>
				<FormInput
					label="Address"
					value={values.address}
					onChange={(e) => update('address', e.target.value)}
					error={errors.address}
					placeholder="Optional"
				/>
				<FormInput
					label="Phone"
					value={values.phone}
					onChange={(e) => update('phone', e.target.value)}
					error={errors.phone}
					placeholder="Optional"
				/>
				<FormSwitch
					label="Active"
					description="Inactive locations won't appear in selectors"
					checked={values.isActive}
					onCheckedChange={(v) => update('isActive', v)}
				/>
			</div>
		)
	},
)

LocationForm.displayName = 'LocationForm'

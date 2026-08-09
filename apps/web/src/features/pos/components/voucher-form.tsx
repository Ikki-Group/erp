import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormDatePicker } from '@/components/form/form-date-picker'
import { FormInput } from '@/components/form/form-input'
import { FormNumberField } from '@/components/form/form-number-field'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

import { VOUCHER_TYPE_OPTIONS, VoucherCreateDto } from '../dto/index.ts'

import type { VoucherDto } from '../dto/index.ts'

export interface VoucherFormValues {
	code: string
	name: string
	type: string
	value: number | null
	minPurchase: number | null
	maxDiscount: number | null
	validFrom: Date | undefined
	validUntil: Date | undefined
	usageLimit: number | null
	isActive: boolean
}

export interface VoucherFormRef {
	getValues: () => VoucherFormValues
	validate: () => Record<string, string> | null
}

interface VoucherFormProps {
	defaultValues?: VoucherDto
}

export const VoucherForm = forwardRef<VoucherFormRef, VoucherFormProps>(
	({ defaultValues }, ref) => {
		const [values, setValues] = useState<VoucherFormValues>({
			code: defaultValues?.code ?? '',
			name: defaultValues?.name ?? '',
			type: defaultValues?.type ?? 'percentage',
			value: defaultValues?.value ? Number(defaultValues.value) : null,
			minPurchase: defaultValues?.minPurchase ? Number(defaultValues.minPurchase) : null,
			maxDiscount: defaultValues?.maxDiscount ? Number(defaultValues.maxDiscount) : null,
			validFrom: defaultValues?.validFrom ? new Date(defaultValues.validFrom) : undefined,
			validUntil: defaultValues?.validUntil ? new Date(defaultValues.validUntil) : undefined,
			usageLimit: defaultValues?.usageLimit ?? null,
			isActive: defaultValues?.isActive ?? true,
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof VoucherFormValues, value: string | number | boolean | Date | null | undefined) => {
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
				const result = VoucherCreateDto.safeParse({
					...values,
					minPurchase: values.minPurchase || null,
					maxDiscount: values.maxDiscount || null,
					usageLimit: values.usageLimit || null,
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
						placeholder="e.g. DISKON20"
					/>
					<FormSelect
						label="Type"
						options={[...VOUCHER_TYPE_OPTIONS]}
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
					placeholder="e.g. Diskon 20% All Items"
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormNumberField
						label={values.type === 'percentage' ? 'Value (%)' : 'Value (Rp)'}
						value={values.value ?? undefined}
						onChange={(v) => update('value', v)}
						min={1}
						max={values.type === 'percentage' ? 100 : undefined}
						error={errors.value}
					/>
					<FormNumberField
						label="Min. Purchase (Rp)"
						value={values.minPurchase ?? undefined}
						onChange={(v) => update('minPurchase', v)}
						min={0}
						error={errors.minPurchase}
						description="Optional"
					/>
				</div>
				{values.type === 'percentage' && (
					<FormNumberField
						label="Max Discount (Rp)"
						value={values.maxDiscount ?? undefined}
						onChange={(v) => update('maxDiscount', v)}
						min={1}
						error={errors.maxDiscount}
						description="Cap the discount amount"
					/>
				)}
				<div className="grid grid-cols-2 gap-4">
					<FormDatePicker
						label="Valid From"
						value={values.validFrom}
						onChange={(d) => update('validFrom', d)}
						error={errors.validFrom}
					/>
					<FormDatePicker
						label="Valid Until"
						value={values.validUntil}
						onChange={(d) => update('validUntil', d)}
						error={errors.validUntil}
					/>
				</div>
				<FormNumberField
					label="Usage Limit"
					value={values.usageLimit ?? undefined}
					onChange={(v) => update('usageLimit', v)}
					min={1}
					error={errors.usageLimit}
					description="Leave empty for unlimited usage"
				/>
				<FormSwitch
					label="Active"
					description="Inactive vouchers cannot be applied at checkout."
					checked={values.isActive}
					onCheckedChange={(checked) => update('isActive', checked)}
				/>
			</div>
		)
	},
)

VoucherForm.displayName = 'VoucherForm'

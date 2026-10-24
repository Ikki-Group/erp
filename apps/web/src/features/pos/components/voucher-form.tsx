import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { VOUCHER_TYPE_OPTIONS, VoucherTypeEnum } from '../dto/index.ts'
import type { VoucherDto } from '../dto/index.ts'

export interface VoucherFormValues {
	code: string
	name: string
	type: VoucherTypeEnum
	value: string
	minPurchase: string
	maxDiscount: string
	validFrom: Date | undefined
	validUntil: Date | undefined
	usageLimit: string
	isActive: boolean
}

const decimalString = (message: string) =>
	z
		.string()
		.trim()
		.regex(/^\d*(\.\d+)?$/u, message)
		.default('')

const VoucherFormSchema = z
	.object({
		code: z.string().trim().min(1, 'Code is required').max(50),
		name: z.string().trim().min(3, 'Name must be at least 3 characters').max(255),
		type: VoucherTypeEnum,
		value: z
			.string()
			.trim()
			.regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
		minPurchase: decimalString('Must be a positive number'),
		maxDiscount: decimalString('Must be a positive number'),
		validFrom: z.date({ error: 'Valid From is required' }),
		validUntil: z.date({ error: 'Valid Until is required' }),
		usageLimit: z.string().trim().regex(/^\d*$/u, 'Must be a whole number').default(''),
		isActive: z.boolean(),
	})
	.refine((v) => v.validFrom < v.validUntil, {
		error: 'Must be after Valid From',
		path: ['validUntil'],
	})
	.refine((v) => v.type !== 'percentage' || Number(v.value) <= 100, {
		error: 'Percentage cannot exceed 100',
		path: ['value'],
	})

export const EMPTY_VOUCHER_FORM_VALUES: VoucherFormValues = {
	code: '',
	name: '',
	type: 'percentage',
	value: '',
	minPurchase: '',
	maxDiscount: '',
	validFrom: undefined,
	validUntil: undefined,
	usageLimit: '',
	isActive: true,
}

export function toVoucherFormValues(voucher: VoucherDto): VoucherFormValues {
	return {
		code: voucher.code,
		name: voucher.name,
		type: voucher.type,
		value: voucher.value,
		minPurchase: voucher.minPurchase ?? '',
		maxDiscount: voucher.maxDiscount ?? '',
		validFrom: new Date(voucher.validFrom),
		validUntil: new Date(voucher.validUntil),
		usageLimit: voucher.usageLimit?.toString() ?? '',
		isActive: voucher.isActive,
	}
}

export interface UseVoucherFormOptions {
	defaultValues?: VoucherFormValues
	onSubmit: (values: VoucherFormValues) => Promise<void>
}

export function useVoucherForm({ defaultValues, onSubmit }: UseVoucherFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_VOUCHER_FORM_VALUES,
		schema: VoucherFormSchema,
		onSubmit,
	})
}

export type VoucherForm = ReturnType<typeof useVoucherForm>

export function VoucherFormFields({ form }: { form: VoucherForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. DISKON20" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Type" options={[...VOUCHER_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="e.g. Diskon 20% All Items" />}
			</form.AppField>

			<div className="grid grid-cols-2 gap-4">
				<form.Subscribe selector={(state) => state.values.type}>
					{(type) => (
						<form.AppField name="value">
							{(field) =>
								type === 'percentage' ? (
									<field.TextField label="Value (%)" placeholder="e.g. 20" />
								) : (
									<field.CurrencyField label="Value" />
								)
							}
						</form.AppField>
					)}
				</form.Subscribe>
				<form.AppField name="minPurchase">
					{(field) => <field.CurrencyField label="Min. Purchase" description="Optional" />}
				</form.AppField>
			</div>

			<form.Subscribe selector={(state) => state.values.type}>
				{(type) =>
					type === 'percentage' && (
						<form.AppField name="maxDiscount">
							{(field) => (
								<field.CurrencyField label="Max Discount" description="Cap the discount amount" />
							)}
						</form.AppField>
					)
				}
			</form.Subscribe>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="validFrom">
					{(field) => <field.DatePickerField label="Valid From" />}
				</form.AppField>
				<form.AppField name="validUntil">
					{(field) => <field.DatePickerField label="Valid Until" />}
				</form.AppField>
			</div>

			<form.AppField name="usageLimit">
				{(field) => (
					<field.TextField
						label="Usage Limit"
						placeholder="Leave empty for unlimited usage"
						description="Leave empty for unlimited usage"
					/>
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Active"
						description="Inactive vouchers cannot be applied at checkout."
					/>
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}

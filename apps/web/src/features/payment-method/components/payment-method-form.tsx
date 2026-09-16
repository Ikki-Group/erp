import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { PAYMENT_METHOD_TYPE_OPTIONS, PaymentMethodTypeEnum } from '../dto/index.ts'
import type { PaymentMethodDto } from '../dto/index.ts'

export interface PaymentMethodFormValues {
	code: string
	name: string
	type: PaymentMethodTypeEnum
	isActive: boolean
}

const PaymentMethodFormSchema = z.object({
	code: z.string().trim().min(1, 'Code is required').max(50),
	name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
	type: PaymentMethodTypeEnum,
	isActive: z.boolean(),
})

export const EMPTY_PAYMENT_METHOD_FORM_VALUES: PaymentMethodFormValues = {
	code: '',
	name: '',
	type: 'cash',
	isActive: true,
}

export function toPaymentMethodFormValues(method: PaymentMethodDto): PaymentMethodFormValues {
	return {
		code: method.code,
		name: method.name,
		type: method.type,
		isActive: method.isActive,
	}
}

export interface UsePaymentMethodFormOptions {
	defaultValues?: PaymentMethodFormValues
	onSubmit: (values: PaymentMethodFormValues) => Promise<void>
}

export function usePaymentMethodForm({ defaultValues, onSubmit }: UsePaymentMethodFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_PAYMENT_METHOD_FORM_VALUES,
		schema: PaymentMethodFormSchema,
		onSubmit,
	})
}

export type PaymentMethodForm = ReturnType<typeof usePaymentMethodForm>

export function PaymentMethodFormFields({ form }: { form: PaymentMethodForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. CASH" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Type" options={[...PAYMENT_METHOD_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>
			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="e.g. Cash" />}
			</form.AppField>
			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Active"
						description="Inactive methods won't appear in POS checkout."
					/>
				)}
			</form.AppField>
			<form.FormError />
		</div>
	)
}

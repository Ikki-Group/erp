import { z } from 'zod'

import { useEntityEditor } from '@/lib/form/use-entity-editor.ts'
import type { EntityForm } from '@/lib/form/use-entity-form.ts'

import { paymentMethodMutations } from '../api.ts'
import {
	PAYMENT_METHOD_TYPE_OPTIONS,
	PaymentMethodCreateDto,
	PaymentMethodTypeEnum,
} from '../dto/index.ts'
import type { PaymentMethodDto } from '../dto/index.ts'

export interface PaymentMethodFormValues {
	code: string
	name: string
	type: PaymentMethodTypeEnum
	isActive: boolean
}

const PaymentMethodFormSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
	name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
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

export function toPaymentMethodInput(values: PaymentMethodFormValues): PaymentMethodCreateDto {
	return PaymentMethodCreateDto.parse(values)
}

export const PAYMENT_METHOD_SAVE_DENIED =
	'Anda tidak memiliki izin untuk menyimpan metode pembayaran ini.'

export type PaymentMethodForm = EntityForm<PaymentMethodFormValues>

export function usePaymentMethodForm({
	method,
	canWrite,
	onSaved,
}: {
	method?: PaymentMethodDto
	/** Presentation guard; the server stays authoritative. */
	canWrite: boolean
	onSaved: () => void | Promise<void>
}): PaymentMethodForm {
	return useEntityEditor({
		defaultValues: method ? toPaymentMethodFormValues(method) : EMPTY_PAYMENT_METHOD_FORM_VALUES,
		schema: PaymentMethodFormSchema,
		mutation: {
			mutationFn: async (input: PaymentMethodCreateDto) => {
				if (!canWrite) throw new Error(PAYMENT_METHOD_SAVE_DENIED)
				return method
					? paymentMethodMutations.update.fetch({ ...input, id: method.id })
					: paymentMethodMutations.create.fetch(input)
			},
		},
		toPayload: toPaymentMethodInput,
		successMessage: method
			? 'Metode pembayaran berhasil diperbarui.'
			: 'Metode pembayaran berhasil dibuat.',
		onSaved,
	})
}

export function PaymentMethodFormFields({ form }: { form: PaymentMethodForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Kode" placeholder="mis. CASH" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Tipe" options={[...PAYMENT_METHOD_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>
			<form.AppField name="name">
				{(field) => <field.TextField label="Nama" placeholder="mis. Tunai" />}
			</form.AppField>
			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Aktif"
						description="Metode nonaktif tidak akan muncul di pembayaran POS."
					/>
				)}
			</form.AppField>
		</div>
	)
}

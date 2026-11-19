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
		code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
		name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255),
		type: VoucherTypeEnum,
		value: z
			.string()
			.trim()
			.regex(/^\d+(\.\d+)?$/u, 'Harus berupa angka positif'),
		minPurchase: decimalString('Harus berupa angka positif'),
		maxDiscount: decimalString('Harus berupa angka positif'),
		validFrom: z.date({ error: 'Berlaku Dari wajib diisi' }),
		validUntil: z.date({ error: 'Berlaku Sampai wajib diisi' }),
		usageLimit: z.string().trim().regex(/^\d*$/u, 'Harus bilangan bulat').default(''),
		isActive: z.boolean(),
	})
	.refine((v) => v.validFrom < v.validUntil, {
		error: 'Harus setelah Berlaku Dari',
		path: ['validUntil'],
	})
	.refine((v) => v.type !== 'percentage' || Number(v.value) <= 100, {
		error: 'Persentase tidak boleh melebihi 100',
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
					{(field) => <field.TextField label="Kode" placeholder="mis. DISKON20" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Tipe" options={[...VOUCHER_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Nama" placeholder="mis. Diskon 20% Semua Item" />}
			</form.AppField>

			<div className="grid grid-cols-2 gap-4">
				<form.Subscribe selector={(state) => state.values.type}>
					{(type) => (
						<form.AppField name="value">
							{(field) =>
								type === 'percentage' ? (
									<field.TextField label="Nilai (%)" placeholder="mis. 20" />
								) : (
									<field.CurrencyField label="Nilai" />
								)
							}
						</form.AppField>
					)}
				</form.Subscribe>
				<form.AppField name="minPurchase">
					{(field) => <field.CurrencyField label="Min. Pembelian" description="Opsional" />}
				</form.AppField>
			</div>

			<form.Subscribe selector={(state) => state.values.type}>
				{(type) =>
					type === 'percentage' && (
						<form.AppField name="maxDiscount">
							{(field) => (
								<field.CurrencyField label="Maks. Diskon" description="Batasi jumlah diskon" />
							)}
						</form.AppField>
					)
				}
			</form.Subscribe>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="validFrom">
					{(field) => <field.DatePickerField label="Berlaku Dari" />}
				</form.AppField>
				<form.AppField name="validUntil">
					{(field) => <field.DatePickerField label="Berlaku Sampai" />}
				</form.AppField>
			</div>

			<form.AppField name="usageLimit">
				{(field) => (
					<field.TextField
						label="Batas Pemakaian"
						placeholder="Kosongkan untuk pemakaian tak terbatas"
						description="Kosongkan untuk pemakaian tak terbatas"
					/>
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Aktif"
						description="Voucher nonaktif tidak dapat dipakai saat pembayaran."
					/>
				)}
			</form.AppField>

			<form.AppForm>
				<form.FormError />
			</form.AppForm>
		</div>
	)
}

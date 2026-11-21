import { z } from 'zod'

import { isApiError } from '@/lib/api'
import { useEntityEditor } from '@/lib/form/use-entity-editor'

import { supplierResource } from '../api'
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
	isActive: boolean
}

/** Form-shape schema — see `docs/web/06-ui-patterns.md` for why this isn't `SupplierCreateDto` directly. */
const SupplierFormSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(255),
	contactPerson: z.string().trim().max(255).default(''),
	phone: z.string().trim().max(50).default(''),
	email: z
		.string()
		.trim()
		.max(255)
		.refine((v) => v === '' || z.email().safeParse(v).success, {
			error: 'Alamat email tidak valid',
		})
		.default(''),
	address: z.string().trim().max(500).default(''),
	paymentTerms: z.string().trim().regex(/^\d*$/u, 'Harus bilangan bulat hari').default(''),
	isActive: z.boolean(),
})

export const EMPTY_SUPPLIER_FORM_VALUES: SupplierFormValues = {
	code: '',
	name: '',
	contactPerson: '',
	phone: '',
	email: '',
	address: '',
	paymentTerms: '',
	isActive: true,
}

export function toSupplierFormValues(supplier: SupplierDto): SupplierFormValues {
	return {
		code: supplier.code,
		name: supplier.name,
		contactPerson: supplier.contactPerson ?? '',
		phone: supplier.phone ?? '',
		email: supplier.email ?? '',
		address: supplier.address ?? '',
		paymentTerms: supplier.paymentTerms?.toString() ?? '',
		isActive: supplier.isActive,
	}
}

export function toSupplierInput(values: SupplierFormValues): SupplierCreateDto {
	return SupplierCreateDto.parse({
		...values,
		contactPerson: values.contactPerson.trim() || null,
		phone: values.phone.trim() || null,
		email: values.email.trim() || null,
		address: values.address.trim() || null,
		paymentTerms: values.paymentTerms ? Number(values.paymentTerms) : null,
	})
}

function supplierSaveError(error: unknown): unknown {
	return isApiError(error) && error.status === 409
		? new Error('Kode pemasok sudah ada. Gunakan kode lain.', { cause: error })
		: error
}

export function useSupplierForm({
	supplier,
	onSaved,
}: {
	supplier?: SupplierDto
	onSaved: () => void | Promise<void>
}) {
	return useEntityEditor({
		defaultValues: supplier ? toSupplierFormValues(supplier) : EMPTY_SUPPLIER_FORM_VALUES,
		schema: SupplierFormSchema,
		mutation: {
			mutationFn: (input: SupplierCreateDto) =>
				supplier
					? supplierResource.update.fetch({ ...input, id: supplier.id })
					: supplierResource.create.fetch(input),
		},
		toPayload: toSupplierInput,
		successMessage: supplier ? 'Pemasok berhasil diperbarui.' : 'Pemasok berhasil dibuat.',
		mapError: supplierSaveError,
		onSaved,
	})
}

export type SupplierForm = ReturnType<typeof useSupplierForm>

/** The supplier form's field layout. Shared by the full-page create/edit routes. */
export function SupplierFormFields({ form }: { form: SupplierForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Kode" placeholder="mis. SUP-001" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Nama" placeholder="mis. PT Sumber Makmur" />}
				</form.AppField>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="contactPerson">
					{(field) => <field.TextField label="Narahubung" placeholder="Opsional" />}
				</form.AppField>
				<form.AppField name="phone">
					{(field) => <field.TextField label="Telepon" placeholder="Opsional" />}
				</form.AppField>
			</div>

			<form.AppField name="email">
				{(field) => <field.TextField label="Email" placeholder="Opsional" />}
			</form.AppField>

			<form.AppField name="address">
				{(field) => <field.TextField label="Alamat" placeholder="Opsional" />}
			</form.AppField>

			<form.AppField name="paymentTerms">
				{(field) => (
					<field.TextField
						label="Termin Pembayaran (hari)"
						placeholder="mis. 30"
						inputMode="numeric"
						className="text-right font-mono tabular-nums"
					/>
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Aktif"
						description="Pemasok nonaktif tidak akan muncul di pilihan pembelian."
					/>
				)}
			</form.AppField>
		</div>
	)
}

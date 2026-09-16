import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

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
	code: z.string().trim().min(1, 'Code is required').max(50),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	contactPerson: z.string().trim().max(255).default(''),
	phone: z.string().trim().max(50).default(''),
	email: z
		.string()
		.trim()
		.max(255)
		.refine((v) => v === '' || z.email().safeParse(v).success, { error: 'Invalid email address' })
		.default(''),
	address: z.string().trim().max(500).default(''),
	paymentTerms: z.string().trim().regex(/^\d*$/u, 'Must be a whole number of days').default(''),
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

export interface UseSupplierFormOptions {
	defaultValues?: SupplierFormValues
	onSubmit: (values: SupplierFormValues) => Promise<void>
}

export function useSupplierForm({ defaultValues, onSubmit }: UseSupplierFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_SUPPLIER_FORM_VALUES,
		schema: SupplierFormSchema,
		onSubmit,
	})
}

export type SupplierForm = ReturnType<typeof useSupplierForm>

/** The supplier form's field layout. Shared by the full-page create/edit routes. */
export function SupplierFormFields({ form }: { form: SupplierForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. SUP-001" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" placeholder="e.g. PT Sumber Makmur" />}
				</form.AppField>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="contactPerson">
					{(field) => <field.TextField label="Contact Person" placeholder="Optional" />}
				</form.AppField>
				<form.AppField name="phone">
					{(field) => <field.TextField label="Phone" placeholder="Optional" />}
				</form.AppField>
			</div>

			<form.AppField name="email">
				{(field) => <field.TextField label="Email" placeholder="Optional" />}
			</form.AppField>

			<form.AppField name="address">
				{(field) => <field.TextField label="Address" placeholder="Optional" />}
			</form.AppField>

			<form.AppField name="paymentTerms">
				{(field) => <field.TextField label="Payment Terms (days)" placeholder="e.g. 30" />}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Active"
						description="Inactive suppliers won't appear in purchasing selections."
					/>
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}

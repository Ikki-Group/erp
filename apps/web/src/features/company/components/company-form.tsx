import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

export interface CompanyFormValues {
	name: string
	address: string
	phone: string
	email: string
	taxId: string
	taxRate: string
	currencyCode: string
	currencySymbol: string
	receiptFooter: string
}

/**
 * Validates the form's own shape — plain strings for the optional/nullable
 * text fields (matches the `TextField`/`Textarea` convention), converted to
 * `string | null` at the submit boundary. See `docs/web/06-ui-patterns.md`.
 */
const CompanyFormSchema = z.object({
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	address: z.string().trim().max(500).default(''),
	phone: z.string().trim().max(50).default(''),
	email: z.union([z.string().trim().max(255).email('Invalid email'), z.literal('')]).default(''),
	taxId: z.string().trim().max(50).default(''),
	taxRate: z
		.string()
		.trim()
		.regex(/^\d+(\.\d{1,2})?$/u, 'Must be a positive decimal (max 2 decimals)'),
	currencyCode: z.string().trim().min(1, 'Required').max(10),
	currencySymbol: z.string().trim().min(1, 'Required').max(10),
	receiptFooter: z.string().trim().max(1000).default(''),
})

export const EMPTY_COMPANY_FORM_VALUES: CompanyFormValues = {
	name: '',
	address: '',
	phone: '',
	email: '',
	taxId: '',
	taxRate: '0',
	currencyCode: 'IDR',
	currencySymbol: 'Rp',
	receiptFooter: '',
}

export interface UseCompanyFormOptions {
	defaultValues?: CompanyFormValues
	onSubmit: (values: CompanyFormValues) => Promise<void>
}

export function useCompanyForm({ defaultValues, onSubmit }: UseCompanyFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_COMPANY_FORM_VALUES,
		schema: CompanyFormSchema,
		onSubmit,
	})
}

export type CompanyForm = ReturnType<typeof useCompanyForm>

/** The company settings field layout, split into logical sections like the previous card layout. */
export function CompanyFormFields({ form }: { form: CompanyForm }) {
	return (
		<div className="grid gap-6">
			<div className="grid gap-4 rounded-lg border p-4">
				<h2 className="text-sm font-medium">Company Info</h2>
				<form.AppField name="name">
					{(field) => <field.TextField label="Company Name" placeholder="PT. Example" />}
				</form.AppField>
				<form.AppField name="email">
					{(field) => <field.TextField label="Email" placeholder="info@company.com" />}
				</form.AppField>
				<form.AppField name="phone">
					{(field) => <field.TextField label="Phone" placeholder="+62 812 3456 7890" />}
				</form.AppField>
				<form.AppField name="address">
					{(field) => (
						<field.TextareaField
							label="Address"
							placeholder="Jl. Example No. 1, Jakarta"
							rows={3}
						/>
					)}
				</form.AppField>
			</div>

			<div className="grid gap-4 rounded-lg border p-4">
				<h2 className="text-sm font-medium">Tax & Currency</h2>
				<form.AppField name="taxId">
					{(field) => <field.TextField label="Tax ID (NPWP)" placeholder="00.000.000.0-000.000" />}
				</form.AppField>
				<form.AppField name="taxRate">
					{(field) => (
						<field.TextField
							label="Tax Rate (%)"
							placeholder="11"
							description="Default tax rate applied to transactions"
						/>
					)}
				</form.AppField>
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="currencyCode">
						{(field) => <field.TextField label="Currency Code" placeholder="IDR" />}
					</form.AppField>
					<form.AppField name="currencySymbol">
						{(field) => <field.TextField label="Currency Symbol" placeholder="Rp" />}
					</form.AppField>
				</div>
			</div>

			<div className="grid gap-4 rounded-lg border p-4">
				<h2 className="text-sm font-medium">Receipt</h2>
				<form.AppField name="receiptFooter">
					{(field) => (
						<field.TextareaField
							label="Receipt Footer"
							placeholder="Thank you for your purchase!"
							rows={3}
						/>
					)}
				</form.AppField>
			</div>

			<form.FormError />
		</div>
	)
}

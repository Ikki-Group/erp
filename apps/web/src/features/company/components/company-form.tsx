import { z } from 'zod'

import { useEntityEditor } from '@/lib/form/use-entity-editor.ts'
import type { EntityForm } from '@/lib/form/use-entity-form.ts'

import { companyUpdate } from '../api.ts'
import { CompanySettingsUpdateDto } from '../dto/index.ts'
import type { CompanySettingsDto } from '../dto/index.ts'

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

export function toCompanyFormValues(
	settings: Pick<
		CompanySettingsDto,
		| 'name'
		| 'address'
		| 'phone'
		| 'email'
		| 'taxId'
		| 'taxRate'
		| 'currencyCode'
		| 'currencySymbol'
		| 'receiptFooter'
	>,
): CompanyFormValues {
	return {
		name: settings.name,
		address: settings.address ?? '',
		phone: settings.phone ?? '',
		email: settings.email ?? '',
		taxId: settings.taxId ?? '',
		taxRate: settings.taxRate,
		currencyCode: settings.currencyCode,
		currencySymbol: settings.currencySymbol,
		receiptFooter: settings.receiptFooter ?? '',
	}
}

/**
 * The update body for the singleton. `logoUrl` has no field on this form, so it is
 * carried over from the loaded record instead of being erased by the save.
 */
export function toCompanyInput(
	values: CompanyFormValues,
	existing: Pick<CompanySettingsDto, 'id' | 'logoUrl'>,
): CompanySettingsUpdateDto {
	return CompanySettingsUpdateDto.parse({ ...values, id: existing.id, logoUrl: existing.logoUrl })
}

export const COMPANY_UPDATE_DENIED = 'You do not have permission to edit company settings.'

export function useCompanyForm({
	settings,
	canWrite,
}: {
	settings: CompanySettingsDto
	canWrite: boolean
}): CompanyForm {
	return useEntityEditor({
		defaultValues: toCompanyFormValues(settings),
		schema: CompanyFormSchema,
		mutation: {
			mutationFn: async (input: CompanySettingsUpdateDto) => {
				if (!canWrite) throw new Error(COMPANY_UPDATE_DENIED)
				return companyUpdate.fetch(input)
			},
		},
		toPayload: (values) => toCompanyInput(values, settings),
		baselineAfterSave: (payload) =>
			toCompanyFormValues({
				...payload,
				address: payload.address ?? null,
				phone: payload.phone ?? null,
				email: payload.email ?? null,
				taxId: payload.taxId ?? null,
				receiptFooter: payload.receiptFooter ?? null,
			}),
		successMessage: 'Company settings updated.',
	})
}

export type CompanyForm = EntityForm<CompanyFormValues>

/** The company settings field layout, split into logical sections like the previous card layout. */
export function CompanyFormFields({ form }: { form: CompanyForm }) {
	return (
		<div className="grid gap-6">
			<div className="grid gap-4 rounded-lg border p-4">
				<h2 className="font-heading text-sm font-semibold tracking-tight">Company Info</h2>
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
				<h2 className="font-heading text-sm font-semibold tracking-tight">Tax & Currency</h2>
				<form.AppField name="taxId">
					{(field) => <field.TextField label="Tax ID (NPWP)" placeholder="00.000.000.0-000.000" />}
				</form.AppField>
				<form.AppField name="taxRate">
					{(field) => (
						<field.TextField
							label="Tax Rate (%)"
							placeholder="11"
							inputMode="decimal"
							className="text-right font-mono tabular-nums"
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
				<h2 className="font-heading text-sm font-semibold tracking-tight">Receipt</h2>
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
		</div>
	)
}

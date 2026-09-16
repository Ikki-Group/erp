import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { LOCATION_TYPE_OPTIONS, LocationTypeEnum } from '../dto/index.ts'

export interface LocationFormValues {
	code: string
	name: string
	type: LocationTypeEnum
	address: string
	phone: string
	isActive: boolean
}

/**
 * Validates the form's own shape — see `docs/web/06-ui-patterns.md` for why
 * this is never the wire-contract `LocationCreateDto` directly. `address`/
 * `phone` are plain `string` here (empty text inputs) vs. the DTO's
 * `string | null | undefined`.
 */
const LocationFormSchema = z.object({
	code: z.string().trim().min(1, 'Code is required').max(50),
	name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
	type: LocationTypeEnum,
	address: z.string().trim().max(500).default(''),
	phone: z.string().trim().max(50).default(''),
	isActive: z.boolean(),
})

export const EMPTY_LOCATION_FORM_VALUES: LocationFormValues = {
	code: '',
	name: '',
	type: 'store',
	address: '',
	phone: '',
	isActive: true,
}

export interface UseLocationFormOptions {
	defaultValues?: LocationFormValues
	onSubmit: (values: LocationFormValues) => Promise<void>
}

export function useLocationForm({ defaultValues, onSubmit }: UseLocationFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_LOCATION_FORM_VALUES,
		schema: LocationFormSchema,
		onSubmit,
	})
}

export type LocationForm = ReturnType<typeof useLocationForm>

/** The location form's field layout. Shared by the full-page create/edit routes. */
export function LocationFormFields({ form }: { form: LocationForm }) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. LOC-001" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Type" options={[...LOCATION_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="Location name" />}
			</form.AppField>

			<form.AppField name="address">
				{(field) => <field.TextField label="Address" placeholder="Optional" />}
			</form.AppField>

			<form.AppField name="phone">
				{(field) => <field.TextField label="Phone" placeholder="Optional" />}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField
						label="Active"
						description="Inactive locations won't appear in selectors."
					/>
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}

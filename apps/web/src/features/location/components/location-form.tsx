import { Building2Icon, CircleCheckIcon, MapPinIcon, PhoneIcon } from 'lucide-react'
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
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
			<div className="grid gap-6">
				<section className="rounded-xl border bg-card p-5 shadow-sm shadow-slate-950/3 sm:p-6">
					<div className="mb-5 flex items-start gap-3 border-b pb-4">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<MapPinIcon className="size-4" />
						</div>
						<div>
							<h2 className="text-sm font-semibold">Location identity</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Use a clear name and a short code your team can recognize at a glance.
							</p>
						</div>
					</div>

					<div className="grid gap-5">
						<form.AppField name="name">
							{(field) => (
								<field.TextField
									label="Name"
									placeholder="e.g. Kemang store"
									description="The name shown throughout your workspace."
								/>
							)}
						</form.AppField>

						<div className="grid gap-5 sm:grid-cols-2">
							<form.AppField name="code">
								{(field) => (
									<field.TextField
										label="Code"
										placeholder="e.g. LOC-001"
										description="A unique internal reference."
									/>
								)}
							</form.AppField>
							<form.AppField name="type">
								{(field) => (
									<field.SelectField
										label="Type"
										options={[...LOCATION_TYPE_OPTIONS]}
										description="Helps teams identify how this location is used."
									/>
								)}
							</form.AppField>
						</div>
					</div>
				</section>

				<section className="rounded-xl border bg-card p-5 shadow-sm shadow-slate-950/3 sm:p-6">
					<div className="mb-5 flex items-start gap-3 border-b pb-4">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<PhoneIcon className="size-4" />
						</div>
						<div>
							<h2 className="text-sm font-semibold">Contact details</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Optional details help your team reach the right people quickly.
							</p>
						</div>
					</div>

					<div className="grid gap-5 sm:grid-cols-2">
						<form.AppField name="address">
							{(field) => <field.TextField label="Address" placeholder="Optional" />}
						</form.AppField>
						<form.AppField name="phone">
							{(field) => <field.TextField label="Phone" placeholder="Optional" />}
						</form.AppField>
					</div>
				</section>

				<section className="rounded-xl border bg-muted/35 p-5 sm:p-6">
					<form.AppField name="isActive">
						{(field) => (
							<field.SwitchField
								label="Available for use"
								description="Inactive locations stay in your records but won't appear in selectors."
							/>
						)}
					</form.AppField>
				</section>

				<form.FormError />
			</div>

			<aside className="hidden space-y-5 lg:block">
				<div className="rounded-xl border bg-primary/4.5 p-5">
					<Building2Icon className="mb-4 size-5 text-primary" />
					<h2 className="text-sm font-semibold">A location is a working place</h2>
					<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
						Stores and warehouses keep stock, materials, and daily operations organized by place.
					</p>
				</div>
				<div className="space-y-3 px-1">
					<div className="flex gap-2.5">
						<CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
						<p className="text-xs leading-relaxed text-muted-foreground">
							Keep the code short and consistent.
						</p>
					</div>
					<div className="flex gap-2.5">
						<CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
						<p className="text-xs leading-relaxed text-muted-foreground">
							Deactivate a location instead of deleting its history.
						</p>
					</div>
				</div>
			</aside>
		</div>
	)
}

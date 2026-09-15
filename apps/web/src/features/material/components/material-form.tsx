import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { categoryResource } from '../api.ts'
import { MATERIAL_TYPE_OPTIONS, MaterialTypeEnum } from '../dto/index.ts'

import { uomResource } from '@/features/uom/api.ts'

export interface MaterialFormValues {
	code: string
	name: string
	type: 'raw' | 'semi_finished'
	categoryId: number | null
	baseUomId: number | null
	defaultPurchaseUomId: number | null
	defaultStockUomId: number | null
	defaultRecipeUomId: number | null
	minStock: string
	isActive: boolean
}

/**
 * Validates the form's own shape — deliberately NOT `MaterialCreateDto`
 * (the wire-contract schema in `../dto/index.ts`). The two differ in ways
 * that matter for a good validation message:
 *
 * - `minStock` is `string` here (an empty text input, not yet `null`) vs.
 *   the DTO's `string | null`, which rejects `''` outright.
 * - `baseUomId` is `number | null` here (unselected before the user picks
 *   one) vs. the DTO's plain `number`, whose Zod error reads
 *   "expected number, received null" — accurate but not user-facing.
 *
 * The DTO still validates the true wire payload, built separately in each
 * route's `onSubmit` (see `materials/new.tsx`) — this schema only owns the
 * in-progress form state. See `docs/web/06-ui-patterns.md`.
 */
const MaterialFormSchema = z.object({
	code: z.string().trim().min(1, 'Code is required').max(50),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	type: MaterialTypeEnum,
	categoryId: z.number().int().positive().nullable(),
	baseUomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Base UoM is required' }),
	defaultPurchaseUomId: z.number().int().positive().nullable(),
	defaultStockUomId: z.number().int().positive().nullable(),
	defaultRecipeUomId: z.number().int().positive().nullable(),
	minStock: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal')
		.or(z.literal(''))
		.default(''),
	isActive: z.boolean(),
})

export const EMPTY_MATERIAL_FORM_VALUES: MaterialFormValues = {
	code: '',
	name: '',
	type: 'raw',
	categoryId: null,
	baseUomId: null,
	defaultPurchaseUomId: null,
	defaultStockUomId: null,
	defaultRecipeUomId: null,
	minStock: '',
	isActive: true,
}

export interface UseMaterialFormOptions {
	defaultValues?: MaterialFormValues
	onSubmit: (values: MaterialFormValues) => Promise<void>
}

/**
 * The material create/update form logic — validation, field wiring, submit
 * boundary. Returns the `form` instance; render it with `<MaterialFormFields form={form} />`
 * inside whatever shell the call site needs (`FormPage` for the full-page
 * route, or a `FormDialog` body for a quicker flow).
 */
export function useMaterialForm({ defaultValues, onSubmit }: UseMaterialFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_MATERIAL_FORM_VALUES,
		// Create and update share the same field shape (the id, when editing,
		// lives outside form state — see the route's `onSubmit`), so one
		// schema validates both.
		schema: MaterialFormSchema,
		onSubmit,
	})
}

export type MaterialForm = ReturnType<typeof useMaterialForm>

interface MaterialFormFieldsProps {
	form: MaterialForm
}

/** The material form's field layout. Shared by the full-page and dialog entry points. */
export function MaterialFormFields({ form }: MaterialFormFieldsProps) {
	const categoriesQuery = useQuery(categoryResource.list.queryOptions({ page: 1, limit: 100 }))
	const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const categoryOptions = (categoriesQuery.data?.data ?? []).map((c) => ({
		label: c.name,
		value: c.id,
	}))
	const uomOptions = (uomQuery.data?.data ?? []).map((u) => ({
		label: `${u.name} (${u.code})`,
		value: u.id,
	}))

	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. MAT-001" />}
				</form.AppField>
				<form.AppField name="type">
					{(field) => <field.SelectField label="Type" options={[...MATERIAL_TYPE_OPTIONS]} />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Name" placeholder="e.g. Tepung Terigu" />}
			</form.AppField>

			<form.AppField name="categoryId">
				{(field) => (
					<field.IdSelectField
						label="Category"
						options={categoryOptions}
						nullableLabel="— None —"
						placeholder="Select category..."
					/>
				)}
			</form.AppField>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="baseUomId">
					{(field) => (
						<field.IdSelectField label="Base UoM" options={uomOptions} placeholder="Select unit..." />
					)}
				</form.AppField>
				<form.AppField name="defaultPurchaseUomId">
					{(field) => (
						<field.IdSelectField
							label="Purchase UoM"
							options={uomOptions}
							nullableLabel="— Same as base —"
							placeholder="Select unit..."
						/>
					)}
				</form.AppField>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="defaultStockUomId">
					{(field) => (
						<field.IdSelectField
							label="Stock UoM"
							options={uomOptions}
							nullableLabel="— Same as base —"
							placeholder="Select unit..."
						/>
					)}
				</form.AppField>
				<form.AppField name="defaultRecipeUomId">
					{(field) => (
						<field.IdSelectField
							label="Recipe UoM"
							options={uomOptions}
							nullableLabel="— Same as base —"
							placeholder="Select unit..."
						/>
					)}
				</form.AppField>
			</div>

			<form.AppField name="minStock">
				{(field) => (
					<field.TextField label="Min Stock" placeholder="e.g. 10.5 (optional)" />
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField label="Active" description="Whether this material is available for use." />
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}

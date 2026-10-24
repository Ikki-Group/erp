import { FormDialogFooter, FormRoot } from '@/lib/form/index.ts'
import { useEntityEditor } from '@/lib/form/use-entity-editor'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

import { MaterialLookupField } from '@/features/material/components/material-lookup-field'
import { UomLookupField } from '@/features/uom/components/uom-lookup-field'

import { pricingResource } from '../api.ts'
import type {
	SupplierMaterialCreateDto,
	SupplierMaterialDto,
	SupplierMaterialUpdateDto,
} from '../dto/index.ts'
import {
	PricingFormSchema,
	toPricingCreateInput,
	toPricingFormValues,
	toPricingUpdateInput,
} from '../pricing-form-values'

interface PricingFormProps {
	supplierId: number
	pricing?: SupplierMaterialDto
	canSave: boolean
	onSaved: () => void
	onCancel: () => void
}

export function PricingForm({ supplierId, pricing, canSave, onSaved, onCancel }: PricingFormProps) {
	const form = useEntityEditor({
		defaultValues: toPricingFormValues(pricing),
		schema: PricingFormSchema,
		mutation: {
			mutationFn: (input: SupplierMaterialCreateDto | SupplierMaterialUpdateDto) => {
				if (!canSave) throw new Error('You do not have permission to save supplier pricing.')
				return 'id' in input
					? pricingResource.update.fetch(input)
					: pricingResource.create.fetch(input)
			},
		},
		toPayload: (values) =>
			pricing ? toPricingUpdateInput(pricing.id, values) : toPricingCreateInput(supplierId, values),
		successMessage: pricing ? 'Pricing updated successfully.' : 'Pricing added successfully.',
		onSaved,
	})

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4 pt-4">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<fieldset disabled={!canSave || isSubmitting} className="grid min-w-0 gap-4">
							<form.AppField name="materialId">
								{() => (
									<MaterialLookupField
										label="Material"
										disabled={!!pricing || !canSave || isSubmitting}
										description={
											pricing ? 'Material cannot be changed for existing pricing.' : undefined
										}
									/>
								)}
							</form.AppField>
							<div className="grid min-w-0 gap-4 sm:grid-cols-2">
								<form.AppField name="unitPrice">
									{(field) => <field.CurrencyField label="Unit Price" />}
								</form.AppField>
								<form.AppField name="uomId">
									{() => <UomLookupField label="UoM" disabled={!canSave || isSubmitting} />}
								</form.AppField>
							</div>
							<form.AppField name="minOrderQty">
								{(field) => (
									<field.TextField
										label="Min Order Qty"
										placeholder="Optional"
										inputMode="decimal"
										className="text-right font-mono tabular-nums"
									/>
								)}
							</form.AppField>
						</fieldset>
					)}
				</form.Subscribe>
				{!canSave && <p role="alert">You do not have permission to save supplier pricing.</p>}
				<form.FormError />
				{canSave ? (
					<FormDialogFooter onCancel={onCancel} submitLabel={pricing ? 'Save Changes' : 'Add'} />
				) : (
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</DialogFooter>
				)}
			</FormRoot>
		</form.AppForm>
	)
}

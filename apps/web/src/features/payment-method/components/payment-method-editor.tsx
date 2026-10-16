import { useStore } from '@tanstack/react-form'

import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'

import { Button } from '@/components/ui/button'

import type { PaymentMethodDto } from '../dto/index.ts'
import { PaymentMethodFormFields, usePaymentMethodForm } from './payment-method-form.tsx'

/** Create (no `method`) or edit page body. Mount it keyed by entity ID once the detail has loaded. */
export function PaymentMethodEditor({
	method,
	canWrite,
	onDone,
}: {
	method?: PaymentMethodDto
	canWrite: boolean
	onDone: () => void
}) {
	const form = usePaymentMethodForm({ method, canWrite, onSaved: onDone })
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<EntityEditorPage
			title={method ? 'Edit Payment Method' : 'Add Payment Method'}
			description={method ? `Update details for ${method.name}.` : 'Create a new payment method.'}
			form={form}
			submitLabel={method ? 'Save Changes' : 'Create'}
			onCancel={onDone}
			readOnly={!canWrite}
			actions={
				!canWrite ? (
					<p className="text-xs text-muted-foreground">
						You don&apos;t have permission to {method ? 'edit' : 'create'} payment methods.
					</p>
				) : saveFailed ? (
					// A failed save blocks the submit button until the next edit; retrying the same values must stay possible.
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => {
							form.setErrorMap({ onSubmit: undefined })
							void form.handleSubmit()
						}}
					>
						Retry save
					</Button>
				) : undefined
			}
		>
			<fieldset disabled={!canWrite} className="contents">
				<PaymentMethodFormFields form={form} />
			</fieldset>
		</EntityEditorPage>
	)
}

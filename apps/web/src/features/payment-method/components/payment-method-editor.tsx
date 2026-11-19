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
			title={method ? 'Ubah Metode Pembayaran' : 'Tambah Metode Pembayaran'}
			description={
				method ? `Perbarui detail untuk ${method.name}.` : 'Buat metode pembayaran baru.'
			}
			form={form}
			submitLabel={method ? 'Simpan Perubahan' : 'Buat'}
			onCancel={onDone}
			readOnly={!canWrite}
			actions={
				!canWrite ? (
					<p className="text-xs text-muted-foreground">
						Anda tidak memiliki izin untuk {method ? 'mengubah' : 'membuat'} metode pembayaran.
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
						Coba lagi simpan
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

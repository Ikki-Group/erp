import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { paymentMethodMutations } from '@/features/payment-method/api.ts'
import {
	PaymentMethodFormFields,
	usePaymentMethodForm,
} from '@/features/payment-method/components/payment-method-form.tsx'

export const Route = createFileRoute('/_authenticated/master/payment-methods/new')({
	component: NewPaymentMethodPage,
})

function NewPaymentMethodPage() {
	const navigate = useNavigate()
	const createMut = useMutation(paymentMethodMutations.create.mutationOptions())

	const form = usePaymentMethodForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync(values)
			toast.add({ title: 'Payment method created.', type: 'success' })
			navigate({ to: '/master/payment-methods' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Payment Method"
				description="Create a new payment method."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/master/payment-methods' })}
			>
				<PaymentMethodFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
